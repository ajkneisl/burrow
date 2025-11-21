package app.burrow.burrows.invites

import app.burrow.Error
import app.burrow.NotFound
import app.burrow.account.Users
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.burrows.getBurrow
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.models.Burrows
import app.burrow.models.PaginatedResponse
import app.burrow.notifications.createNotification
import app.burrow.notifications.NotificationKind
import app.burrow.notifications.onUserJoinedMeeting
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.alias
import kotlin.math.ceil
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** An invitation for a user to join a burrow. */
@Serializable
data class Invite(
    /** The ID of the Burrow. */
    val burrowID: String,

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
) {
    companion object {
        /**
         * Form an [Invite] from a [ResultRow].
         *
         * @param row A [ResultRow] containing an [Invite].
         */
        fun fromRow(row: ResultRow) =
            Invite(
                burrowID = row[Invites.burrowID],
                inviterID = row[Invites.inviterID],
                inviteeID = row[Invites.inviteeID],
                status = row[Invites.status],
                createdAt = row[Invites.createdAt],
                respondedAt = row[Invites.respondedAt],
                expiresAt = row[Invites.expiresAt],
            )
    }
}

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
 * Create an invitation for a user to join a burrow.
 *
 * @param inviterId The ID of the user sending the invitation (must be host/moderator).
 * @param inviteeId The ID of the user being invited.
 * @param burrowId The ID of the burrow.
 * @param expiresAt Optional expiration timestamp. If null, defaults to 7 days from now.
 * @throws Error If the burrow doesn't exist, invitee is banned, already has membership, or
 *   already has a pending invite.
 */
suspend fun createInvite(
    inviterId: String,
    inviteeId: String,
    burrowId: String,
    expiresAt: Long? = null,
) {
    val burrow = getBurrow(burrowId) ?: throw Error(404, "Burrow does not exist.")

    // Check if burrow has ended
    if (getTimeMillis() > burrow.endTime) {
        throw Error(400, "This Burrow has already ended.")
    }

    // Prevent self-invites
    if (inviterId == inviteeId) {
        throw Error(400, "You cannot invite yourself.")
    }

    query {
        // Check for existing membership
        val existingMembership =
            Memberships.selectAll()
                .where { (Memberships.userID eq inviteeId) and (Memberships.burrowID eq burrowId) }
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

        // Check for existing pending invite from anyone
        val existingInvite =
            Invites.selectAll()
                .where { (Invites.burrowID eq burrowId) and (Invites.inviteeID eq inviteeId) }
                .firstOrNull()

        if (existingInvite != null) {
            when (existingInvite[Invites.status]) {
                InviteStatus.PENDING ->
                    throw Error(400, "This user already has a pending invite to this Burrow.")
                InviteStatus.ACCEPTED ->
                    throw Error(400, "This user already accepted an invite to this Burrow.")
                InviteStatus.DECLINED,
                InviteStatus.EXPIRED -> {
                    // Check if this specific inviter already invited them
                    if (existingInvite[Invites.inviterID] == inviterId) {
                        // Update existing invite
                        Invites.update({
                            (Invites.burrowID eq burrowId) and
                                (Invites.inviterID eq inviterId) and
                                (Invites.inviteeID eq inviteeId)
                        }) {
                            it[status] = InviteStatus.PENDING
                            it[createdAt] = getTimeMillis()
                            it[respondedAt] = null
                            it[Invites.expiresAt] =
                                expiresAt ?: (getTimeMillis() + DEFAULT_INVITE_EXPIRATION_MS)
                        }

                        // Create notification for the invitee
                        createNotification(
                            title = "Burrow Invite",
                            content = "You've been invited to join ${burrow.title}",
                            userID = inviteeId,
                            burrowID = burrowId,
                            kind = NotificationKind.INVITE_RECEIVED
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
            it[Invites.burrowID] = burrowId
            it[Invites.inviterID] = inviterId
            it[Invites.inviteeID] = inviteeId
            it[Invites.status] = InviteStatus.PENDING
            it[Invites.createdAt] = getTimeMillis()
            it[Invites.respondedAt] = null
            it[Invites.expiresAt] = expiration
        }
    }

    // Create notification for the invitee
    createNotification(
        title = "Burrow Invite",
        content = "You've been invited to join ${burrow.title}",
        userID = inviteeId,
        burrowID = burrowId,
        kind = NotificationKind.INVITE_RECEIVED
    )
}

/**
 * Get all pending invites for a burrow with user information.
 *
 * @param burrowId The ID of the burrow.
 * @return List of invites with user information.
 */
private const val INVITES_PAGE_SIZE = 5

suspend fun getInvitesForBurrow(burrowId: String, page: Int = 1): PaginatedResponse<InviteWithUsers> = query {
    val inviterAlias = Users.alias("inviter")
    val inviteeAlias = Users.alias("invitee")
    val inviterProfileAlias = Profiles.alias("inviter_profile")
    val inviteeProfileAlias = Profiles.alias("invitee_profile")

    val query = Invites.innerJoin(inviterAlias, { Invites.inviterID }, { inviterAlias[Users.id] })
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
        .where { (Invites.burrowID eq burrowId) and (Invites.status eq InviteStatus.PENDING) }

    val itemCount = query.count()

    val invites = query
        .limit(INVITES_PAGE_SIZE)
        .offset(INVITES_PAGE_SIZE * (page - 1L))
        .toList()
        .map { row ->
            InviteWithUsers(
                invite = Invite.fromRow(row),
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
 * @return List of invites with inviter information.
 */
suspend fun getReceivedInvites(
    userId: String,
    status: InviteStatus? = null,
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

    val results =
        if (status != null) {
            query.where { (Invites.inviteeID eq userId) and (Invites.status eq status) }
        } else {
            query.where { Invites.inviteeID eq userId }
        }

    results.toList().map { row ->
        InviteWithUsers(
            invite = Invite.fromRow(row),
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
 * @return List of invites with invitee information.
 */
suspend fun getSentInvites(userId: String, status: InviteStatus? = null): List<InviteWithUsers> =
    query {
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

        val results =
            if (status != null) {
                query.where { (Invites.inviterID eq userId) and (Invites.status eq status) }
            } else {
                query.where { Invites.inviterID eq userId }
            }

        results.toList().map { row ->
            InviteWithUsers(
                invite = Invite.fromRow(row),
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
 * @param burrowId The ID of the burrow.
 * @return The invite, or null if not found.
 */
suspend fun getInvite(inviterId: String, inviteeId: String, burrowId: String): Invite? = query {
    Invites.selectAll()
        .where {
            (Invites.inviterID eq inviterId) and
                (Invites.inviteeID eq inviteeId) and
                (Invites.burrowID eq burrowId)
        }
        .firstOrNull()
        ?.let { Invite.fromRow(it) }
}

/**
 * Check if a user has a pending invite to a burrow.
 *
 * @param inviteeId The ID of the user.
 * @param burrowId The ID of the burrow.
 * @return True if the user has a pending invite, false otherwise.
 */
suspend fun hasPendingInvite(inviteeId: String, burrowId: String): Boolean = query {
    Invites.selectAll()
        .where {
            (Invites.inviteeID eq inviteeId) and
                (Invites.burrowID eq burrowId) and
                (Invites.status eq InviteStatus.PENDING)
        }
        .firstOrNull() != null
}

/**
 * Accept an invitation and join the burrow. If the burrow is at capacity, the user will be added to
 * the waitlist.
 *
 * @param inviteeId The ID of the user accepting the invitation (must match the invitee).
 * @param burrowId The ID of the burrow.
 * @param inviterId Optional inviter ID. If provided, only accepts invite from that specific
 *   inviter. If null, accepts any pending invite to this burrow.
 * @throws Error If the invite doesn't exist, is not pending, or the burrow doesn't exist.
 */
suspend fun acceptInvite(inviteeId: String, burrowId: String, inviterId: String? = null) {
    val burrow = getBurrow(burrowId) ?: throw NotFound("That Burrow could not be found.")

    if (getTimeMillis() > burrow.endTime) {
        throw Error(400, "This Burrow has already ended.")
    }

    query {
        // Get the invite
        val inviteQuery =
            if (inviterId != null) {
                Invites.selectAll().where {
                    (Invites.inviteeID eq inviteeId) and
                        (Invites.burrowID eq burrowId) and
                        (Invites.inviterID eq inviterId)
                }
            } else {
                Invites.selectAll().where {
                    (Invites.inviteeID eq inviteeId) and
                        (Invites.burrowID eq burrowId) and
                        (Invites.status eq InviteStatus.PENDING)
                }
            }

        val invite = inviteQuery.firstOrNull() ?: throw Error(404, "Invite not found.")

        if (invite[Invites.status] != InviteStatus.PENDING) {
            throw Error(400, "This invite has already been responded to.")
        }

        // Check if invite has expired
        val expiresAt = invite[Invites.expiresAt]
        if (expiresAt != null && getTimeMillis() > expiresAt) {
            // Mark as expired
            Invites.update({
                (Invites.burrowID eq burrowId) and
                    (Invites.inviterID eq invite[Invites.inviterID]) and
                    (Invites.inviteeID eq inviteeId)
            }) {
                it[status] = InviteStatus.EXPIRED
            }
            throw Error(400, "This invite has expired.")
        }

        // Check current membership count and capacity
        val count =
            Memberships.selectAll()
                .where {
                    (Memberships.burrowID eq burrowId) and
                        (Memberships.status eq BurrowMemberStatus.JOINED)
                }
                .count()

        val capacity =
            Burrows.select(Burrows.id, Burrows.capacity)
                .where { Burrows.id eq burrowId }
                .first()[Burrows.capacity]

        val atCapacity = count >= capacity && capacity != 0

        // Check if user already has a membership
        val existingMembership =
            Memberships.selectAll()
                .where { (Memberships.userID eq inviteeId) and (Memberships.burrowID eq burrowId) }
                .firstOrNull()

        val membershipStatus =
            if (atCapacity) BurrowMemberStatus.WAITLISTED else BurrowMemberStatus.JOINED
        val now = getTimeMillis()

        if (existingMembership != null) {
            // Update existing membership
            Memberships.update({
                (Memberships.userID eq inviteeId) and (Memberships.burrowID eq burrowId)
            }) {
                it[status] = membershipStatus
                it[joinedAt] = now
                it[leftAt] = null
                it[role] = BurrowRole.MEMBER
            }
        } else {
            // Create new membership
            Memberships.insert {
                it[Memberships.userID] = inviteeId
                it[Memberships.burrowID] = burrowId
                it[Memberships.joinedAt] = now
                it[Memberships.role] = BurrowRole.MEMBER
                it[Memberships.status] = membershipStatus
            }
        }

        // Update all pending invites for this user to this burrow (from any inviter)
        Invites.update({
            (Invites.burrowID eq burrowId) and
                (Invites.inviteeID eq inviteeId) and
                (Invites.status eq InviteStatus.PENDING)
        }) {
            it[status] = InviteStatus.ACCEPTED
            it[respondedAt] = now
        }

        // Send notification if they were joined (not waitlisted)
        if (membershipStatus == BurrowMemberStatus.JOINED) {
            onUserJoinedMeeting(inviteeId, burrowId)
        }
    }
}

/**
 * Decline an invitation.
 *
 * @param inviteeId The ID of the user declining the invitation (must match the invitee).
 * @param burrowId The ID of the burrow.
 * @param inviterId Optional inviter ID. If provided, only declines invite from that specific
 *   inviter. If null, declines all pending invites to this burrow.
 * @throws Error If the invite doesn't exist or is not pending.
 */
suspend fun declineInvite(inviteeId: String, burrowId: String, inviterId: String? = null) {
    query {
        val inviteQuery =
            if (inviterId != null) {
                Invites.selectAll().where {
                    (Invites.inviteeID eq inviteeId) and
                        (Invites.burrowID eq burrowId) and
                        (Invites.inviterID eq inviterId)
                }
            } else {
                Invites.selectAll().where {
                    (Invites.inviteeID eq inviteeId) and
                        (Invites.burrowID eq burrowId) and
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
                (Invites.burrowID eq burrowId) and
                    (Invites.inviterID eq inviterId) and
                    (Invites.inviteeID eq inviteeId)
            } else {
                (Invites.burrowID eq burrowId) and
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
 * @param burrowId The ID of the burrow.
 * @throws Error If the invite doesn't exist or is not pending.
 */
suspend fun cancelInvite(inviterId: String, inviteeId: String, burrowId: String) {
    query {
        val invite =
            Invites.selectAll()
                .where {
                    (Invites.inviterID eq inviterId) and
                        (Invites.inviteeID eq inviteeId) and
                        (Invites.burrowID eq burrowId)
                }
                .firstOrNull() ?: throw Error(404, "Invite not found.")

        if (invite[Invites.status] != InviteStatus.PENDING) {
            throw Error(400, "This invite has already been responded to.")
        }

        // Delete the invite entirely when cancelled
        Invites.deleteWhere {
            (Invites.burrowID eq burrowId) and
                (Invites.inviterID eq inviterId) and
                (Invites.inviteeID eq inviteeId)
        }
    }
}

/**
 * Get count of pending invites for a burrow.
 *
 * @param burrowId The ID of the burrow.
 * @return The count of pending invites.
 */
suspend fun getPendingInviteCount(burrowId: String): Long = query {
    Invites.selectAll()
        .where { (Invites.burrowID eq burrowId) and (Invites.status eq InviteStatus.PENDING) }
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
