package app.burrow.burrows.invites

import app.burrow.Error
import app.burrow.account.Users
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.burrows.getBurrow
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowRole
import app.burrow.notifications.onUserJoinedMeeting
import app.burrow.query
import app.burrow.throwIfNull
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** A request from a user to join a Burrow. */
@Serializable
data class JoinRequest(
    /** The ID of the Burrow. */
    val burrowID: String,

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
) {
    companion object {
        /**
         * Form a [JoinRequest] from a [ResultRow].
         *
         * @param row A [ResultRow] containing a [JoinRequest].
         */
        fun fromRow(row: ResultRow) =
            JoinRequest(
                burrowID = row[JoinRequests.burrowID],
                requesterID = row[JoinRequests.requesterID],
                status = row[JoinRequests.status],
                createdAt = row[JoinRequests.createdAt],
                reviewedAt = row[JoinRequests.reviewedAt],
                reviewedBy = row[JoinRequests.reviewedBy],
            )
    }
}

/**
 * A join request with user information.
 *
 * @param request The join request.
 * @param requester The user who made the request.
 * @param requesterProfile The profile of the user who made the request.
 */
@Serializable
data class JoinRequestWithUser(
    val request: JoinRequest,
    val requester: String,
    val requesterProfile: Profile?,
)

/**
 * Create a join request for a user to join a burrow.
 *
 * @param userID The ID of the user requesting to join.
 * @param burrowID The ID of the burrow to join.
 * @throws Error If the burrow doesn't exist, user is banned, already has membership, or
 *   already has a pending request.
 */
suspend fun createJoinRequest(userID: String, burrowID: String) {
    val burrow = getBurrow(burrowID).throwIfNull()

    // Check if burrow has ended
    if (getTimeMillis() > burrow.endTime) {
        throw Error(400, "This Burrow has already ended.")
    }

    query {
        // Check for existing membership
        val existingMembership =
            Memberships.selectAll()
                .where { (Memberships.userID eq userID) and (Memberships.meetingID eq burrowID) }
                .firstOrNull()

        if (existingMembership != null) {
            when (existingMembership[Memberships.status]) {
                BurrowMemberStatus.BANNED ->
                    throw Error(403, "You are banned from this burrow.")

                BurrowMemberStatus.JOINED,
                BurrowMemberStatus.WAITLISTED ->
                    throw Error(400, "You are already a member of this burrow.")

                else -> {}
            }
        }

        // check for existing request
        val existingRequest =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.burrowID eq burrowID) and (JoinRequests.requesterID eq userID)
                }
                .firstOrNull()

        if (existingRequest != null) {
            when (existingRequest[JoinRequests.status]) {
                JoinRequestStatus.PENDING ->
                    throw Error(400, "You already have a pending request for this Burrow.")

                JoinRequestStatus.APPROVED ->
                    throw Error(400, "Your request was already approved.")

                JoinRequestStatus.REJECTED -> {
                    // reup the existing request
                    JoinRequests.update({
                        (JoinRequests.burrowID eq burrowID) and (JoinRequests.requesterID eq userID)
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
            it[JoinRequests.burrowID] = burrowID
            it[JoinRequests.requesterID] = userID
            it[JoinRequests.status] = JoinRequestStatus.PENDING
            it[JoinRequests.createdAt] = getTimeMillis()
            it[JoinRequests.reviewedAt] = null
            it[JoinRequests.reviewedBy] = null
        }
    }
}

/**
 * Get all pending join requests for a Burrow with user information.
 *
 * @param burrowID The ID of the burrow.
 * @return List of join requests with user information.
 */
suspend fun getJoinRequests(burrowID: String): List<JoinRequestWithUser> = query {
    JoinRequests.innerJoin(Users, { JoinRequests.requesterID }, { Users.id })
        .innerJoin(Profiles, { JoinRequests.requesterID }, { Profiles.userID })
        .selectAll()
        .where {
            (JoinRequests.burrowID eq burrowID) and
                (JoinRequests.status eq JoinRequestStatus.PENDING)
        }
        .toList()
        .map { row ->
            JoinRequestWithUser(
                request = JoinRequest.fromRow(row),
                requester = row[Users.username],
                requesterProfile = Profile.fromRow(row),
            )
        }
}

/**
 * Get all join requests for a specific user across all Burrows.
 *
 * @param userID The ID of the user.
 * @param status Optional status filter. If null, returns all statuses.
 * @return List of join requests.
 */
suspend fun getJoinRequestsForUser(
    userID: String,
    status: JoinRequestStatus? = null,
): List<JoinRequest> = query {
    val query = JoinRequests.selectAll().where { JoinRequests.requesterID eq userID }

    if (status != null) {
        query.where { (JoinRequests.requesterID eq userID) and (JoinRequests.status eq status) }
    }

    query.toList().map { JoinRequest.fromRow(it) }
}

/**
 * Get a specific join request.
 *
 * @param userID The ID of the user.
 * @param burrowID The ID of the burrow.
 * @return The join request, or null if not found.
 */
suspend fun getJoinRequest(userID: String, burrowID: String): JoinRequest? = query {
    JoinRequests.selectAll()
        .where { (JoinRequests.requesterID eq userID) and (JoinRequests.burrowID eq burrowID) }
        .firstOrNull()
        ?.let { JoinRequest.fromRow(it) }
}

/**
 * Check if a user has a pending join request for a burrow.
 *
 * @param userID The ID of the user.
 * @param burrowID The ID of the burrow.
 * @return True if the user has a pending request, false otherwise.
 */
suspend fun hasPendingJoinRequest(userID: String, burrowID: String): Boolean = query {
    JoinRequests.selectAll()
        .where {
            (JoinRequests.requesterID eq userID) and
                (JoinRequests.burrowID eq burrowID) and
                (JoinRequests.status eq JoinRequestStatus.PENDING)
        }
        .firstOrNull() != null
}

/**
 * Accept a join request, and join the [userId] into the [burrowId]. If it's full, add them to
 * waitlist.
 *
 * @param userId The ID of the user who made the request.
 * @param burrowId The ID of the burrow.
 * @param reviewerId The ID of the user accepting the request (must be host/moderator).
 * @throws Error If the request doesn't exist, is not pending, or the burrow doesn't exist.
 */
suspend fun acceptJoinRequest(userId: String, burrowId: String, reviewerId: String) {
    val burrow = getBurrow(burrowId).throwIfNull()
    val now = getTimeMillis()

    // check if ended
    if (now > burrow.endTime) {
        throw Error(400, "This Burrow has already ended.")
    }

    query {
        // Get the request
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userId) and (JoinRequests.burrowID eq burrowId)
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
                    (Memberships.meetingID eq burrowId) and
                        (Memberships.status eq BurrowMemberStatus.JOINED)
                }
                .count()

        val atCapacity = count >= burrow.capacity && burrow.capacity != 0

        // check if they're got an existing membership (previously left)
        val existingMembership =
            Memberships.selectAll()
                .where { (Memberships.userID eq userId) and (Memberships.meetingID eq burrowId) }
                .firstOrNull()

        val membershipStatus =
            if (atCapacity) BurrowMemberStatus.WAITLISTED else BurrowMemberStatus.JOINED

        if (existingMembership != null) {
            // Update existing membership
            Memberships.update({
                (Memberships.userID eq userId) and (Memberships.meetingID eq burrowId)
            }) {
                it[status] = membershipStatus
                it[joinedAt] = now
                it[leftAt] = null
                it[role] = BurrowRole.MEMBER
            }
        } else {
            // Create new membership
            Memberships.insert {
                it[Memberships.userID] = userId
                it[Memberships.meetingID] = burrowId
                it[Memberships.joinedAt] = now
                it[Memberships.role] = BurrowRole.MEMBER
                it[Memberships.status] = membershipStatus
            }
        }

        // update the join request
        JoinRequests.update({
            (JoinRequests.burrowID eq burrowId) and (JoinRequests.requesterID eq userId)
        }) {
            it[status] = JoinRequestStatus.APPROVED
            it[reviewedAt] = now
            it[reviewedBy] = reviewerId
        }

        // send notification that they've joined
        if (membershipStatus == BurrowMemberStatus.JOINED) {
            onUserJoinedMeeting(userId, burrowId)
        }
    }
}

/**
 * Deny a join request.
 *
 * @param userID The ID of the user who made the request.
 * @param burrowID The ID of the burrow.
 * @param reviewerID The ID of the user denying the request (must be host/moderator).
 * @throws Error If the request doesn't exist or is not pending.
 */
suspend fun denyJoinRequest(userID: String, burrowID: String, reviewerID: String) {
    query {
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userID) and (JoinRequests.burrowID eq burrowID)
                }
                .firstOrNull() ?: throw Error(404, "Join request not found.")

        if (request[JoinRequests.status] != JoinRequestStatus.PENDING) {
            throw Error(400, "This request has already been reviewed.")
        }

        JoinRequests.update({
            (JoinRequests.burrowID eq burrowID) and (JoinRequests.requesterID eq userID)
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
 * @param burrowID The ID of the burrow.
 * @throws Error If the request doesn't exist or is not pending.
 */
suspend fun cancelJoinRequest(userID: String, burrowID: String) {
    query {
        val request =
            JoinRequests.selectAll()
                .where {
                    (JoinRequests.requesterID eq userID) and (JoinRequests.burrowID eq burrowID)
                }
                .firstOrNull() ?: throw Error(404, "Join request not found.")

        if (request[JoinRequests.status] != JoinRequestStatus.PENDING) {
            throw Error(400, "This request has already been reviewed.")
        }

        // delete it
        JoinRequests.deleteWhere {
            (JoinRequests.burrowID eq burrowID) and (JoinRequests.requesterID eq userID)
        }
    }
}

/**
 * Get count of pending join requests for a burrow.
 *
 * @param burrowID The ID of the burrow.
 * @return The count of pending requests.
 */
suspend fun getPendingRequestCount(burrowID: String): Long = query {
    JoinRequests.selectAll()
        .where {
            (JoinRequests.burrowID eq burrowID) and
                (JoinRequests.status eq JoinRequestStatus.PENDING)
        }
        .count()
}
