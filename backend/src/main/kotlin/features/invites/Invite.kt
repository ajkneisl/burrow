package app.burrow.features.invites

import app.burrow.api.MappedTable
import app.burrow.api.Error
import app.burrow.api.NotFound
import app.burrow.api.models.PaginatedResponse
import app.burrow.features.account.Users
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.burrows.models.getBurrow
import app.burrow.features.burrows.membership.Memberships
import app.burrow.features.burrows.models.enums.BurrowMemberStatus
import app.burrow.features.burrows.models.enums.BurrowRole
import app.burrow.features.burrows.Burrows
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.members.ClubMembers
import app.burrow.features.notifications.NotificationKind
import app.burrow.features.notifications.createNotification
import app.burrow.features.notifications.onUserJoinedMeeting
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.util.date.getTimeMillis
import kotlin.math.ceil
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** An invitation for a user to join a burrow or club. */
@Serializable
@MappedTable(Invites::class)
data class Invite(
    /** The type of invite (burrow or club). */
    val inviteType: InviteType,

    /** The ID of the target (burrow ID or club ID). */
    val targetID: String,

    /** The ID of the user who sent the invitation. */
    val inviterID: String,

    /** The ID of the user who received the invitation. */
    val inviteeID: String,

    /** The current status of the invitation. */
    val status: InviteStatus,

    /** When the invitation was created (epoch ms). */
    val createdAt: Long,

    /** When the invitation was responded to (epoch ms). */
    val respondedAt: Long?,

    /** When the invitation expires. */
    val expiresAt: Long?,
)

/**
 * An invite with user information.
 *
 * @param invite The invitation.
 * @param inviterUsername The username of the user who sent the invitation.
 * @param inviterProfile The profile of the user who sent the invitation.
 * @param inviteeUsername The username of the user who received the invitation.
 * @param inviteeProfile The profile of the user who received the invitation.
 */
@Serializable
data class InviteWithUsers(
    val invite: Invite,
    val inviterUsername: String,
    val inviterProfile: Profile?,
    val inviteeUsername: String,
    val inviteeProfile: Profile?,
)

/** Default expiration time for invites (7 days in milliseconds). */
private const val DEFAULT_INVITE_EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000

/**
 * Create an invitation for a user to join a burrow or club.
 *
 * @param inviterID The ID of the user sending the invitation.
 * @param inviteeID The ID of the user being invited.
 * @param targetID The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @param expiresAt Optional expiration timestamp. If null, defaults to 7 days from now.
 * @throws Error If the target doesn't exist, invitee is banned, already has membership, or already
 *   has a pending invite.
 */
suspend fun createInvite(
    inviterID: String,
    inviteeID: String,
    targetID: String,
    inviteType: InviteType,
    expiresAt: Long? = null,
) {
    // Prevent self-invites
    if (inviterID == inviteeID) {
        throw Error(400, "You cannot invite yourself.")
    }

    // Target-specific validation
    val notificationTitle: String
    val notificationContent: String

    when (inviteType) {
        InviteType.BURROW -> {
            val burrow = getBurrow(targetID) ?: throw Error(404, "Burrow does not exist.")

            if (getTimeMillis() > burrow.endTime) {
                throw Error(400, "This Burrow has already ended.")
            }

            notificationTitle = "Burrow Invite"
            notificationContent = "You've been invited to join ${burrow.title}"

            query {
                // Check for existing membership
                val existingMembership =
                    Memberships.selectAll()
                        .where {
                            (Memberships.userID eq inviteeID) and (Memberships.burrowID eq targetID)
                        }
                        .firstOrNull()

                if (existingMembership != null) {
                    when (existingMembership[Memberships.status]) {
                        BurrowMemberStatus.BANNED ->
                            throw Error(403, "This user is banned from the burrow.")
                        BurrowMemberStatus.JOINED,
                        BurrowMemberStatus.WAITLISTED ->
                            throw Error(400, "This user is already a member of the burrow.")
                        BurrowMemberStatus.LEFT -> {
                            // Allow inviting users who previously left
                        }
                    }
                }
            }
        }

        InviteType.CLUB -> {
            val club =
                query { Clubs.selectAll().where { Clubs.id eq targetID }.firstOrNull() }
                    ?: throw Error(404, "Club does not exist.")

            notificationTitle = "Club Invite"
            notificationContent = "You've been invited to join ${club[Clubs.displayName]}"

            query {
                // Check for existing club membership
                val existingMember =
                    ClubMembers.selectAll()
                        .where {
                            (ClubMembers.userID eq inviteeID) and (ClubMembers.clubID eq targetID)
                        }
                        .firstOrNull()

                if (existingMember != null) {
                    throw Error(400, "This user is already a member of this club.")
                }
            }
        }
    }

    query {
        // Check for existing pending invite from anyone
        val existingInvite =
            Invites.selectAll()
                .where {
                    (Invites.targetID eq targetID) and
                        (Invites.inviteType eq inviteType) and
                        (Invites.inviteeID eq inviteeID)
                }
                .firstOrNull()

        if (existingInvite != null) {
            when (existingInvite[Invites.status]) {
                InviteStatus.PENDING -> throw Error(400, "This user already has a pending invite.")
                InviteStatus.ACCEPTED -> throw Error(400, "This user already accepted an invite.")
                InviteStatus.DECLINED,
                InviteStatus.EXPIRED -> {
                    // Check if this specific inviter already invited them
                    if (existingInvite[Invites.inviterID] == inviterID) {
                        // Update existing invite
                        Invites.update({
                            (Invites.targetID eq targetID) and
                                (Invites.inviteType eq inviteType) and
                                (Invites.inviterID eq inviterID) and
                                (Invites.inviteeID eq inviteeID)
                        }) {
                            it[status] = InviteStatus.PENDING
                            it[createdAt] = getTimeMillis()
                            it[respondedAt] = null
                            it[Invites.expiresAt] =
                                expiresAt ?: (getTimeMillis() + DEFAULT_INVITE_EXPIRATION_MS)
                        }

                        // Create notification for the invitee
                        createNotification(
                            title = notificationTitle,
                            content = notificationContent,
                            userID = inviteeID,
                            burrowID = targetID,
                            kind = NotificationKind.INVITE_RECEIVED,
                        )

                        return@query
                    }
                    // If it was a different inviter, allow creating a new invite (will be a
                    // separate row)
                }
            }
        }

        // Create new invite
        val expiration = expiresAt ?: (getTimeMillis() + DEFAULT_INVITE_EXPIRATION_MS)

        Invites.insert {
            it[Invites.inviteType] = inviteType
            it[Invites.targetID] = targetID
            it[Invites.inviterID] = inviterID
            it[Invites.inviteeID] = inviteeID
            it[Invites.status] = InviteStatus.PENDING
            it[Invites.createdAt] = getTimeMillis()
            it[Invites.respondedAt] = null
            it[Invites.expiresAt] = expiration
        }
    }

    // Create notification for the invitee
    createNotification(
        title = notificationTitle,
        content = notificationContent,
        userID = inviteeID,
        burrowID = targetID,
        kind = NotificationKind.INVITE_RECEIVED,
    )
}

/**
 * Get all pending invites for a target with user information.
 *
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @param page The page number.
 * @return Paginated list of invites with user information.
 */
private const val INVITES_PAGE_SIZE = 5

suspend fun getInvitesForTarget(
    targetId: String,
    inviteType: InviteType,
    page: Int = 1,
): PaginatedResponse<InviteWithUsers> = query {
    val inviterAlias = Users.alias("inviter")
    val inviteeAlias = Users.alias("invitee")
    val inviterProfileAlias = Profiles.alias("inviter_profile")
    val inviteeProfileAlias = Profiles.alias("invitee_profile")

    val query =
        Invites.innerJoin(inviterAlias, { Invites.inviterID }, { inviterAlias[Users.id] })
            .innerJoin(inviteeAlias, { Invites.inviteeID }, { inviteeAlias[Users.id] })
            .innerJoin(
                inviterProfileAlias,
                { Invites.inviterID },
                { inviterProfileAlias[Profiles.userID] },
            )
            .innerJoin(
                inviteeProfileAlias,
                { Invites.inviteeID },
                { inviteeProfileAlias[Profiles.userID] },
            )
            .selectAll()
            .where {
                (Invites.targetID eq targetId) and
                    (Invites.inviteType eq inviteType) and
                    (Invites.status eq InviteStatus.PENDING)
            }

    val itemCount = query.count()

    val invites =
        query.limit(INVITES_PAGE_SIZE).offset(INVITES_PAGE_SIZE * (page - 1L)).toList().map { row ->
            InviteWithUsers(
                invite = row.toEntity(Invites),
                inviterUsername = row[inviterAlias[Users.username]],
                inviterProfile = Profile.fromRow(row, inviterProfileAlias),
                inviteeUsername = row[inviteeAlias[Users.username]],
                inviteeProfile = Profile.fromRow(row, inviteeProfileAlias),
            )
        }

    PaginatedResponse(
        page,
        ceil(itemCount / INVITES_PAGE_SIZE.toDouble()).toInt(),
        itemCount,
        invites,
    )
}

/**
 * Get all invites received by a user.
 *
 * @param userId The ID of the user.
 * @param status Optional status filter. If null, returns all statuses.
 * @param inviteType Optional invite type filter. If null, returns all types.
 * @return List of invites with inviter information.
 */
suspend fun getReceivedInvites(
    userId: String,
    status: InviteStatus? = null,
    inviteType: InviteType? = null,
): List<InviteWithUsers> = query {
    val inviterAlias = Users.alias("inviter")
    val inviterProfileAlias = Profiles.alias("inviter_profile")
    val inviteeAlias = Users.alias("invitee")
    val inviteeProfileAlias = Profiles.alias("invitee_profile")

    val query =
        Invites.innerJoin(inviterAlias, { Invites.inviterID }, { inviterAlias[Users.id] })
            .innerJoin(inviteeAlias, { Invites.inviteeID }, { inviteeAlias[Users.id] })
            .innerJoin(
                inviterProfileAlias,
                { Invites.inviterID },
                { inviterProfileAlias[Profiles.userID] },
            )
            .innerJoin(
                inviteeProfileAlias,
                { Invites.inviteeID },
                { inviteeProfileAlias[Profiles.userID] },
            )
            .selectAll()

    var condition = Invites.inviteeID eq userId
    if (status != null) {
        condition = condition and (Invites.status eq status)
    }
    if (inviteType != null) {
        condition = condition and (Invites.inviteType eq inviteType)
    }

    val results = query.where { condition }

    results.toList().map { row ->
        InviteWithUsers(
            invite = row.toEntity(Invites),
            inviterUsername = row[inviterAlias[Users.username]],
            inviterProfile = Profile.fromRow(row, inviterProfileAlias),
            inviteeUsername = row[inviteeAlias[Users.username]],
            inviteeProfile = Profile.fromRow(row, inviteeProfileAlias),
        )
    }
}

/**
 * Get all invites sent by a user.
 *
 * @param userId The ID of the user.
 * @param status Optional status filter. If null, returns all statuses.
 * @param inviteType Optional invite type filter. If null, returns all types.
 * @return List of invites with invitee information.
 */
suspend fun getSentInvites(
    userId: String,
    status: InviteStatus? = null,
    inviteType: InviteType? = null,
): List<InviteWithUsers> = query {
    val inviterAlias = Users.alias("inviter")
    val inviteeAlias = Users.alias("invitee")
    val inviterProfileAlias = Profiles.alias("inviter_profile")
    val inviteeProfileAlias = Profiles.alias("invitee_profile")

    val query =
        Invites.innerJoin(inviterAlias, { Invites.inviterID }, { inviterAlias[Users.id] })
            .innerJoin(inviteeAlias, { Invites.inviteeID }, { inviteeAlias[Users.id] })
            .innerJoin(
                inviterProfileAlias,
                { Invites.inviterID },
                { inviterProfileAlias[Profiles.userID] },
            )
            .innerJoin(
                inviteeProfileAlias,
                { Invites.inviteeID },
                { inviteeProfileAlias[Profiles.userID] },
            )
            .selectAll()

    var condition = Invites.inviterID eq userId
    if (status != null) {
        condition = condition and (Invites.status eq status)
    }
    if (inviteType != null) {
        condition = condition and (Invites.inviteType eq inviteType)
    }

    val results = query.where { condition }

    results.toList().map { row ->
        InviteWithUsers(
            invite = row.toEntity(Invites),
            inviterUsername = row[inviterAlias[Users.username]],
            inviterProfile = Profile.fromRow(row, inviterProfileAlias),
            inviteeUsername = row[inviteeAlias[Users.username]],
            inviteeProfile = Profile.fromRow(row, inviteeProfileAlias),
        )
    }
}

/**
 * Get a specific invite.
 *
 * @param inviterId The ID of the user who sent the invitation.
 * @param inviteeId The ID of the user who received the invitation.
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @return The invite, or null if not found.
 */
suspend fun getInvite(
    inviterId: String,
    inviteeId: String,
    targetId: String,
    inviteType: InviteType,
): Invite? = query {
    Invites.selectAll()
        .where {
            (Invites.inviterID eq inviterId) and
                (Invites.inviteeID eq inviteeId) and
                (Invites.targetID eq targetId) and
                (Invites.inviteType eq inviteType)
        }
        .firstOrNull()
        ?.toEntity(Invites)
}

/**
 * Check if a user has a pending invite to a target.
 *
 * @param inviteeId The ID of the user.
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @return True if the user has a pending invite, false otherwise.
 */
suspend fun hasPendingInvite(inviteeId: String, targetId: String, inviteType: InviteType): Boolean =
    query {
        Invites.selectAll()
            .where {
                (Invites.inviteeID eq inviteeId) and
                    (Invites.targetID eq targetId) and
                    (Invites.inviteType eq inviteType) and
                    (Invites.status eq InviteStatus.PENDING)
            }
            .firstOrNull() != null
    }

/**
 * Accept an invitation and join the burrow or club. If a burrow is at capacity, the user will be
 * added to the waitlist.
 *
 * @param inviteeId The ID of the user accepting the invitation (must match the invitee).
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @param inviterId Optional inviter ID. If provided, only accepts invite from that specific
 *   inviter. If null, accepts any pending invite to this target.
 * @throws Error If the invite doesn't exist, is not pending, or the target doesn't exist.
 */
suspend fun acceptInvite(
    inviteeId: String,
    targetId: String,
    inviteType: InviteType,
    inviterId: String? = null,
) {
    when (inviteType) {
        InviteType.BURROW -> acceptBurrowInvite(inviteeId, targetId, inviterId)
        InviteType.CLUB -> acceptClubInvite(inviteeId, targetId, inviterId)
    }
}

private suspend fun acceptBurrowInvite(inviteeId: String, targetId: String, inviterId: String?) {
    val burrow = getBurrow(targetId) ?: throw NotFound("That Burrow could not be found.")

    if (getTimeMillis() > burrow.endTime) {
        throw Error(400, "This Burrow has already ended.")
    }

    query {
        val invite = findPendingInvite(inviteeId, targetId, InviteType.BURROW, inviterId)
        checkInviteExpiry(invite, targetId, InviteType.BURROW, inviteeId)

        // Check current membership count and capacity
        val count =
            Memberships.selectAll()
                .where {
                    (Memberships.burrowID eq targetId) and
                        (Memberships.status eq BurrowMemberStatus.JOINED)
                }
                .count()

        val capacity =
            Burrows.select(Burrows.id, Burrows.capacity)
                .where { Burrows.id eq targetId }
                .first()[Burrows.capacity]

        val atCapacity = count >= capacity && capacity != 0

        // Check if user already has a membership
        val existingMembership =
            Memberships.selectAll()
                .where { (Memberships.userID eq inviteeId) and (Memberships.burrowID eq targetId) }
                .firstOrNull()

        val membershipStatus =
            if (atCapacity) BurrowMemberStatus.WAITLISTED else BurrowMemberStatus.JOINED
        val now = getTimeMillis()

        if (existingMembership != null) {
            Memberships.update({
                (Memberships.userID eq inviteeId) and (Memberships.burrowID eq targetId)
            }) {
                it[status] = membershipStatus
                it[joinedAt] = now
                it[leftAt] = null
                it[role] = BurrowRole.MEMBER
            }
        } else {
            Memberships.insert {
                it[Memberships.userID] = inviteeId
                it[Memberships.burrowID] = targetId
                it[Memberships.joinedAt] = now
                it[Memberships.role] = BurrowRole.MEMBER
                it[Memberships.status] = membershipStatus
            }
        }

        // Update all pending invites for this user to this burrow (from any inviter)
        Invites.update({
            (Invites.targetID eq targetId) and
                (Invites.inviteType eq InviteType.BURROW) and
                (Invites.inviteeID eq inviteeId) and
                (Invites.status eq InviteStatus.PENDING)
        }) {
            it[status] = InviteStatus.ACCEPTED
            it[respondedAt] = now
        }

        if (membershipStatus == BurrowMemberStatus.JOINED) {
            onUserJoinedMeeting(inviteeId, targetId)
        }
    }
}

private suspend fun acceptClubInvite(inviteeId: String, targetId: String, inviterId: String?) {
    // Verify club exists
    query { Clubs.selectAll().where { Clubs.id eq targetId }.firstOrNull() }
        ?: throw NotFound("That Club could not be found.")

    query {
        val invite = findPendingInvite(inviteeId, targetId, InviteType.CLUB, inviterId)
        checkInviteExpiry(invite, targetId, InviteType.CLUB, inviteeId)

        val now = getTimeMillis()

        // Check if user already has a membership
        val existingMember =
            ClubMembers.selectAll()
                .where { (ClubMembers.userID eq inviteeId) and (ClubMembers.clubID eq targetId) }
                .firstOrNull()

        if (existingMember != null) {
            throw Error(400, "You are already a member of this club.")
        }

        // Create club membership
        ClubMembers.insert {
            it[ClubMembers.userID] = inviteeId
            it[ClubMembers.clubID] = targetId
            it[ClubMembers.joinedAt] = now
            it[ClubMembers.role] = ClubRole.MEMBER
            it[ClubMembers.roleName] = "Member"
        }

        // Update all pending invites for this user to this club
        Invites.update({
            (Invites.targetID eq targetId) and
                (Invites.inviteType eq InviteType.CLUB) and
                (Invites.inviteeID eq inviteeId) and
                (Invites.status eq InviteStatus.PENDING)
        }) {
            it[status] = InviteStatus.ACCEPTED
            it[respondedAt] = now
        }
    }
}

/** Find a pending invite, throwing if not found or already responded to. */
private suspend fun findPendingInvite(
    inviteeId: String,
    targetId: String,
    inviteType: InviteType,
    inviterId: String?,
): ResultRow {
    val inviteQuery =
        if (inviterId != null) {
            Invites.selectAll().where {
                (Invites.inviteeID eq inviteeId) and
                    (Invites.targetID eq targetId) and
                    (Invites.inviteType eq inviteType) and
                    (Invites.inviterID eq inviterId)
            }
        } else {
            Invites.selectAll().where {
                (Invites.inviteeID eq inviteeId) and
                    (Invites.targetID eq targetId) and
                    (Invites.inviteType eq inviteType) and
                    (Invites.status eq InviteStatus.PENDING)
            }
        }

    val invite = inviteQuery.firstOrNull() ?: throw Error(404, "Invite not found.")

    if (invite[Invites.status] != InviteStatus.PENDING) {
        throw Error(400, "This invite has already been responded to.")
    }

    return invite
}

/** Check if an invite has expired, and mark it if so. */
private suspend fun checkInviteExpiry(
    invite: ResultRow,
    targetId: String,
    inviteType: InviteType,
    inviteeId: String,
) {
    val expiresAt = invite[Invites.expiresAt]
    if (expiresAt != null && getTimeMillis() > expiresAt) {
        Invites.update({
            (Invites.targetID eq targetId) and
                (Invites.inviteType eq inviteType) and
                (Invites.inviterID eq invite[Invites.inviterID]) and
                (Invites.inviteeID eq inviteeId)
        }) {
            it[status] = InviteStatus.EXPIRED
        }
        throw Error(400, "This invite has expired.")
    }
}

/**
 * Decline an invitation.
 *
 * @param inviteeId The ID of the user declining the invitation (must match the invitee).
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @param inviterId Optional inviter ID. If provided, only declines invite from that specific
 *   inviter. If null, declines all pending invites to this target.
 * @throws Error If the invite doesn't exist or is not pending.
 */
suspend fun declineInvite(
    inviteeId: String,
    targetId: String,
    inviteType: InviteType,
    inviterId: String? = null,
) {
    query {
        val inviteQuery =
            if (inviterId != null) {
                Invites.selectAll().where {
                    (Invites.inviteeID eq inviteeId) and
                        (Invites.targetID eq targetId) and
                        (Invites.inviteType eq inviteType) and
                        (Invites.inviterID eq inviterId)
                }
            } else {
                Invites.selectAll().where {
                    (Invites.inviteeID eq inviteeId) and
                        (Invites.targetID eq targetId) and
                        (Invites.inviteType eq inviteType) and
                        (Invites.status eq InviteStatus.PENDING)
                }
            }

        val invite = inviteQuery.firstOrNull() ?: throw Error(404, "Invite not found.")

        if (invite[Invites.status] != InviteStatus.PENDING) {
            throw Error(400, "This invite has already been responded to.")
        }

        // Update the invite(s)
        val updateQuery =
            if (inviterId != null) {
                (Invites.targetID eq targetId) and
                    (Invites.inviteType eq inviteType) and
                    (Invites.inviterID eq inviterId) and
                    (Invites.inviteeID eq inviteeId)
            } else {
                (Invites.targetID eq targetId) and
                    (Invites.inviteType eq inviteType) and
                    (Invites.inviteeID eq inviteeId) and
                    (Invites.status eq InviteStatus.PENDING)
            }

        Invites.update({ updateQuery }) {
            it[status] = InviteStatus.DECLINED
            it[respondedAt] = getTimeMillis()
        }
    }
}

/**
 * Cancel an invitation. Can only be called by the user who sent the invitation.
 *
 * @param inviterId The ID of the user who sent the invitation.
 * @param inviteeId The ID of the user who received the invitation.
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @throws Error If the invite doesn't exist or is not pending.
 */
suspend fun cancelInvite(
    inviterId: String,
    inviteeId: String,
    targetId: String,
    inviteType: InviteType,
) {
    query {
        val invite =
            Invites.selectAll()
                .where {
                    (Invites.inviterID eq inviterId) and
                        (Invites.inviteeID eq inviteeId) and
                        (Invites.targetID eq targetId) and
                        (Invites.inviteType eq inviteType)
                }
                .firstOrNull() ?: throw Error(404, "Invite not found.")

        if (invite[Invites.status] != InviteStatus.PENDING) {
            throw Error(400, "This invite has already been responded to.")
        }

        // Delete the invite entirely when cancelled
        Invites.deleteWhere {
            (Invites.targetID eq targetId) and
                (Invites.inviteType eq inviteType) and
                (Invites.inviterID eq inviterId) and
                (Invites.inviteeID eq inviteeId)
        }
    }
}

/**
 * Get count of pending invites for a target.
 *
 * @param targetId The ID of the target (burrow or club).
 * @param inviteType The type of invite.
 * @return The count of pending invites.
 */
suspend fun getPendingInviteCount(targetId: String, inviteType: InviteType): Long = query {
    Invites.selectAll()
        .where {
            (Invites.targetID eq targetId) and
                (Invites.inviteType eq inviteType) and
                (Invites.status eq InviteStatus.PENDING)
        }
        .count()
}

/**
 * Get count of pending invites received by a user.
 *
 * @param userId The ID of the user.
 * @return The count of pending invites.
 */
suspend fun getPendingInviteCountForUser(userId: String): Long = query {
    Invites.selectAll()
        .where { (Invites.inviteeID eq userId) and (Invites.status eq InviteStatus.PENDING) }
        .count()
}

/**
 * Mark expired invites as EXPIRED. This should be called periodically (e.g., in a background job)
 * to clean up old invites.
 *
 * @return The number of invites that were marked as expired.
 */
suspend fun expireOldInvites(): Long = query {
    val now = getTimeMillis()

    // First, count how many will be updated
    val count =
        Invites.selectAll()
            .where { (Invites.status eq InviteStatus.PENDING) and (Invites.expiresAt less now) }
            .count()

    // Update expired invites
    Invites.update({ (Invites.status eq InviteStatus.PENDING) and (Invites.expiresAt less now) }) {
        it[status] = InviteStatus.EXPIRED
        it[respondedAt] = now
    }

    count
}
