package app.burrow.features.requests

import app.burrow.MappedTable
import app.burrow.api.Error
import app.burrow.api.models.PaginatedResponse
import app.burrow.api.throwIfNull
import app.burrow.features.account.Users
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.burrows.models.getBurrow
import app.burrow.features.burrows.membership.Memberships
import app.burrow.features.burrows.models.enums.BurrowMemberStatus
import app.burrow.features.burrows.models.enums.BurrowRole
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.members.ClubMembers
import app.burrow.features.invites.InviteType
import app.burrow.features.notifications.onUserJoinedMeeting
import app.burrow.query
import app.burrow.toEntity
import io.ktor.util.date.getTimeMillis
import kotlin.math.ceil
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** A request from a user to join a Burrow or Club. */
@Serializable
@MappedTable(JoinRequests::class)
data class JoinRequest(
    /** The type of request (burrow or club). */
    val requestType: InviteType,

    /** The ID of the target (burrow ID or club ID). */
    val targetID: String,

    /** The ID of the user requesting to join. */
    val requesterID: String,

    /** The status of the request. */
    val status: JoinRequestStatus,

    /** When the request was created (epoch ms.) */
    val createdAt: Long,

    /** When the request was reviewed. */
    val reviewedAt: Long?,

    /** The ID of the user who reviewed the request. */
    val reviewedBy: String?,
)

/**
 * A join request with user information.
 *
 * @param request The join request.
 * @param requester The username of the user who made the request.
 * @param requesterProfile The profile of the user who made the request.
 */
@Serializable
data class JoinRequestWithUser(
    val request: JoinRequest,
    val requester: String,
    val requesterProfile: Profile?,
)

/**
 * Create a join request for a user to join a burrow or club.
 *
 * @param userID The ID of the user requesting to join.
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @throws Error If the target doesn't exist, user is banned, already has membership, or already has
 *   a pending request.
 */
suspend fun createJoinRequest(
    userID: String,
    targetID: String,
    requestType: InviteType = InviteType.BURROW,
) {
    // Target-specific validation
    when (requestType) {
        InviteType.BURROW -> {
            val burrow = getBurrow(targetID).throwIfNull()

            if (getTimeMillis() > burrow.endTime) {
                throw Error(400, "This Burrow has already ended.")
            }

            query {
                // Check for existing membership
                val existingMembership =
                    Memberships.selectAll()
                        .where {
                            (Memberships.userID eq userID) and (Memberships.burrowID eq targetID)
                        }
                        .firstOrNull()

                if (existingMembership != null) {
                    when (existingMembership[Memberships.status]) {
                        BurrowMemberStatus.BANNED ->
                            throw Error(403, "You are banned from this Burrow.")
                        BurrowMemberStatus.JOINED,
                        BurrowMemberStatus.WAITLISTED ->
                            throw Error(400, "You are already a member of this Burrow.")
                        else -> {}
                    }
                }
            }
        }

        InviteType.CLUB -> {
            query { Clubs.selectAll().where { Clubs.id eq targetID }.firstOrNull() }
                ?: throw Error(404, "Club does not exist.")

            query {
                val existingMember =
                    ClubMembers.selectAll()
                        .where {
                            (ClubMembers.userID eq userID) and (ClubMembers.clubID eq targetID)
                        }
                        .firstOrNull()

                if (existingMember != null) {
                    throw Error(400, "You are already a member of this club.")
                }
            }
        }
    }

    query {
        // check for existing request
        val existingRequest =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.targetID eq targetID) and
                        (JoinRequests.requestType eq requestType) and
                        (JoinRequests.requesterID eq userID)
                }
                .firstOrNull()

        if (existingRequest != null) {
            when (existingRequest[JoinRequests.status]) {
                JoinRequestStatus.PENDING -> throw Error(400, "You already have a pending request.")

                JoinRequestStatus.APPROVED -> throw Error(400, "Your request was already approved.")

                JoinRequestStatus.REJECTED -> {
                    // reup the existing request
                    JoinRequests.update({
                        (JoinRequests.targetID eq targetID) and
                            (JoinRequests.requestType eq requestType) and
                            (JoinRequests.requesterID eq userID)
                    }) {
                        it[status] = JoinRequestStatus.PENDING
                        it[createdAt] = getTimeMillis()
                        it[reviewedAt] = null
                        it[reviewedBy] = null
                    }

                    return@query
                }
            }
        }

        // create new request
        JoinRequests.insert {
            it[JoinRequests.requestType] = requestType
            it[JoinRequests.targetID] = targetID
            it[JoinRequests.requesterID] = userID
            it[JoinRequests.status] = JoinRequestStatus.PENDING
            it[JoinRequests.createdAt] = getTimeMillis()
            it[JoinRequests.reviewedAt] = null
            it[JoinRequests.reviewedBy] = null
        }
    }
}

private const val JOIN_REQUESTS_PAGE_SIZE = 5

/**
 * Get all pending join requests for a target with user information.
 *
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @param page The page number (defaults to 1).
 * @return Paginated response of join requests with user information.
 */
suspend fun getJoinRequests(
    targetID: String,
    requestType: InviteType,
    page: Int = 1,
): PaginatedResponse<JoinRequestWithUser> = query {
    val query =
        JoinRequests.innerJoin(Users, { JoinRequests.requesterID }, { Users.id })
            .innerJoin(Profiles, { JoinRequests.requesterID }, { Profiles.userID })
            .selectAll()
            .where {
                (JoinRequests.targetID eq targetID) and
                    (JoinRequests.requestType eq requestType) and
                    (JoinRequests.status eq JoinRequestStatus.PENDING)
            }

    val itemCount = query.count()

    val requests =
        query
            .limit(JOIN_REQUESTS_PAGE_SIZE)
            .offset(JOIN_REQUESTS_PAGE_SIZE * (page - 1L))
            .toList()
            .map { row ->
                JoinRequestWithUser(
                    request = row.toEntity(JoinRequests),
                    requester = row[Users.username],
                    requesterProfile = row.toEntity(Profiles),
                )
            }

    PaginatedResponse(
        page,
        ceil(itemCount / JOIN_REQUESTS_PAGE_SIZE.toDouble()).toInt(),
        itemCount,
        requests,
    )
}

/**
 * Get all join requests for a specific user.
 *
 * @param userID The ID of the user.
 * @param status Optional status filter. If null, returns all statuses.
 * @param requestType Optional type filter. If null, returns all types.
 * @return List of join requests.
 */
suspend fun getJoinRequestsForUser(
    userID: String,
    status: JoinRequestStatus? = null,
    requestType: InviteType? = null,
): List<JoinRequest> = query {
    var condition = JoinRequests.requesterID eq userID
    if (status != null) {
        condition = condition and (JoinRequests.status eq status)
    }
    if (requestType != null) {
        condition = condition and (JoinRequests.requestType eq requestType)
    }

    JoinRequests.selectAll().where { condition }.toList().map { row -> row.toEntity(JoinRequests) }
}

/**
 * Get a specific join request.
 *
 * @param userID The ID of the user.
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @return The join request, or null if not found.
 */
suspend fun getJoinRequest(
    userID: String,
    targetID: String,
    requestType: InviteType = InviteType.BURROW,
): JoinRequest? = query {
    JoinRequests.selectAll()
        .where {
            (JoinRequests.requesterID eq userID) and
                (JoinRequests.targetID eq targetID) and
                (JoinRequests.requestType eq requestType)
        }
        .firstOrNull()
        ?.toEntity<JoinRequest>(JoinRequests)
}

/**
 * Check if a user has a pending join request for a target.
 *
 * @param userID The ID of the user.
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @return True if the user has a pending request, false otherwise.
 */
suspend fun hasPendingJoinRequest(
    userID: String,
    targetID: String,
    requestType: InviteType,
): Boolean = query {
    JoinRequests.selectAll()
        .where {
            (JoinRequests.requesterID eq userID) and
                (JoinRequests.targetID eq targetID) and
                (JoinRequests.requestType eq requestType) and
                (JoinRequests.status eq JoinRequestStatus.PENDING)
        }
        .firstOrNull() != null
}

/**
 * Accept a join request and add the user to the target.
 *
 * @param userId The ID of the user who made the request.
 * @param targetId The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @param reviewerId The ID of the user accepting the request (must be host/moderator).
 * @throws Error If the request doesn't exist, is not pending, or the target doesn't exist.
 */
suspend fun acceptJoinRequest(
    userId: String,
    targetId: String,
    requestType: InviteType,
    reviewerId: String,
) {
    when (requestType) {
        InviteType.BURROW -> acceptBurrowJoinRequest(userId, targetId, reviewerId)
        InviteType.CLUB -> acceptClubJoinRequest(userId, targetId, reviewerId)
    }
}

private suspend fun acceptBurrowJoinRequest(userId: String, targetId: String, reviewerId: String) {
    val burrow = getBurrow(targetId).throwIfNull()
    val now = getTimeMillis()

    if (now > burrow.endTime) {
        throw Error(400, "This Burrow has already ended.")
    }

    query {
        // Get the request
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userId) and
                        (JoinRequests.targetID eq targetId) and
                        (JoinRequests.requestType eq InviteType.BURROW)
                }
                .firstOrNull()
                .throwIfNull("A join request could not be found.")

        if (request[JoinRequests.status] != JoinRequestStatus.PENDING) {
            throw Error(400, "This request has already been reviewed.")
        }

        // current amount of members
        val count =
            Memberships.selectAll()
                .where {
                    (Memberships.burrowID eq targetId) and
                        (Memberships.status eq BurrowMemberStatus.JOINED)
                }
                .count()

        val atCapacity = count >= burrow.capacity && burrow.capacity != 0

        // check if they've got an existing membership (previously left)
        val existingMembership =
            Memberships.selectAll()
                .where { (Memberships.userID eq userId) and (Memberships.burrowID eq targetId) }
                .firstOrNull()

        val membershipStatus =
            if (atCapacity) BurrowMemberStatus.WAITLISTED else BurrowMemberStatus.JOINED

        if (existingMembership != null) {
            Memberships.update({
                (Memberships.userID eq userId) and (Memberships.burrowID eq targetId)
            }) {
                it[status] = membershipStatus
                it[joinedAt] = now
                it[leftAt] = null
                it[role] = BurrowRole.MEMBER
            }
        } else {
            Memberships.insert {
                it[Memberships.userID] = userId
                it[Memberships.burrowID] = targetId
                it[Memberships.joinedAt] = now
                it[Memberships.role] = BurrowRole.MEMBER
                it[Memberships.status] = membershipStatus
            }
        }

        // update the join request
        JoinRequests.update({
            (JoinRequests.targetID eq targetId) and
                (JoinRequests.requestType eq InviteType.BURROW) and
                (JoinRequests.requesterID eq userId)
        }) {
            it[status] = JoinRequestStatus.APPROVED
            it[reviewedAt] = now
            it[reviewedBy] = reviewerId
        }

        if (membershipStatus == BurrowMemberStatus.JOINED) {
            onUserJoinedMeeting(userId, targetId)
        }
    }
}

private suspend fun acceptClubJoinRequest(userId: String, targetId: String, reviewerId: String) {
    query { Clubs.selectAll().where { Clubs.id eq targetId }.firstOrNull() }
        ?: throw Error(404, "Club does not exist.")

    val now = getTimeMillis()

    query {
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userId) and
                        (JoinRequests.targetID eq targetId) and
                        (JoinRequests.requestType eq InviteType.CLUB)
                }
                .firstOrNull()
                .throwIfNull("A join request could not be found.")

        if (request[JoinRequests.status] != JoinRequestStatus.PENDING) {
            throw Error(400, "This request has already been reviewed.")
        }

        // Check if already a member
        val existingMember =
            ClubMembers.selectAll()
                .where { (ClubMembers.userID eq userId) and (ClubMembers.clubID eq targetId) }
                .firstOrNull()

        if (existingMember != null) {
            throw Error(400, "This user is already a member of this club.")
        }

        // Create club membership
        ClubMembers.insert {
            it[ClubMembers.userID] = userId
            it[ClubMembers.clubID] = targetId
            it[ClubMembers.joinedAt] = now
            it[ClubMembers.role] = ClubRole.MEMBER
            it[ClubMembers.roleName] = "Member"
        }

        // update the join request
        JoinRequests.update({
            (JoinRequests.targetID eq targetId) and
                (JoinRequests.requestType eq InviteType.CLUB) and
                (JoinRequests.requesterID eq userId)
        }) {
            it[status] = JoinRequestStatus.APPROVED
            it[reviewedAt] = now
            it[reviewedBy] = reviewerId
        }
    }
}

/**
 * Deny a join request.
 *
 * @param userID The ID of the user who made the request.
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @param reviewerID The ID of the user denying the request (must be host/moderator).
 * @throws Error If the request doesn't exist or is not pending.
 */
suspend fun denyJoinRequest(
    userID: String,
    targetID: String,
    requestType: InviteType,
    reviewerID: String,
) {
    query {
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userID) and
                        (JoinRequests.targetID eq targetID) and
                        (JoinRequests.requestType eq requestType)
                }
                .firstOrNull() ?: throw Error(404, "Join request not found.")

        if (request[JoinRequests.status] != JoinRequestStatus.PENDING) {
            throw Error(400, "This request has already been reviewed.")
        }

        JoinRequests.update({
            (JoinRequests.targetID eq targetID) and
                (JoinRequests.requestType eq requestType) and
                (JoinRequests.requesterID eq userID)
        }) {
            it[status] = JoinRequestStatus.REJECTED
            it[reviewedAt] = getTimeMillis()
            it[reviewedBy] = reviewerID
        }
    }
}

/**
 * Cancel a join request.
 *
 * @param userID The ID of the user who made the request.
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @throws Error If the request doesn't exist or is not pending.
 */
suspend fun cancelJoinRequest(userID: String, targetID: String, requestType: InviteType) {
    query {
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userID) and
                        (JoinRequests.targetID eq targetID) and
                        (JoinRequests.requestType eq requestType)
                }
                .firstOrNull() ?: throw Error(404, "Join request not found.")

        if (request[JoinRequests.status] != JoinRequestStatus.PENDING) {
            throw Error(400, "This request has already been reviewed.")
        }

        JoinRequests.deleteWhere {
            (JoinRequests.targetID eq targetID) and
                (JoinRequests.requestType eq requestType) and
                (JoinRequests.requesterID eq userID)
        }
    }
}

/**
 * Get count of pending join requests for a target.
 *
 * @param targetID The ID of the target (burrow or club).
 * @param requestType The type of request.
 * @return The count of pending requests.
 */
suspend fun getPendingRequestCount(targetID: String, requestType: InviteType): Long = query {
    JoinRequests.selectAll()
        .where {
            (JoinRequests.targetID eq targetID) and
                (JoinRequests.requestType eq requestType) and
                (JoinRequests.status eq JoinRequestStatus.PENDING)
        }
        .count()
}
