package app.burrow.burrows.membership

import app.burrow.Error
import app.burrow.InvalidAuthorization
import app.burrow.account.Users
import app.burrow.account.models.User
import app.burrow.account.models.userID
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.burrows.Burrow
import app.burrow.burrows.bookmarks.Bookmarks
import app.burrow.burrows.getBurrow
import app.burrow.burrows.invites.JoinRequests
import app.burrow.burrows.invites.createJoinRequest
import app.burrow.burrows.models.BurrowKind
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowResponse
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.models.BurrowVisibility
import app.burrow.burrows.models.Burrows
import app.burrow.burrows.sync.BurrowSync
import app.burrow.models.PaginatedResponse
import app.burrow.notifications.createNotification
import app.burrow.notifications.onUserJoinedMeeting
import app.burrow.notifications.onUserLeaveMeeting
import app.burrow.query
import io.ktor.server.application.ApplicationCall
import io.ktor.util.date.getTimeMillis
import kotlin.math.ceil
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import org.jetbrains.exposed.v1.r2dbc.upsert

/** A membership to a [Burrow]. */
@Serializable
data class Membership(
    val burrowID: String,
    val userID: String,
    val role: BurrowRole,
    val status: BurrowMemberStatus,
    val joinedAt: Long,
    val leftAt: Long?,
) {
    companion object {
        /**
         * Form a [Membership] from a [ResultRow] from a database query.
         *
         * @param row The [ResultRow] containing a [Membership].
         */
        fun fromRow(row: ResultRow) =
            Membership(
                burrowID = row[Memberships.burrowID],
                userID = row[Memberships.userID],
                role = row[Memberships.role],
                status = row[Memberships.status],
                joinedAt = row[Memberships.joinedAt],
                leftAt = row[Memberships.leftAt],
            )
    }
}

/**
 * Check if the user is a moderator.
 *
 * @param meetingId The meeting to check in.
 */
suspend infix fun String.isModerator(meetingId: String): Boolean {
    val membership = getMembership(this, meetingId)

    return membership != null && membership.role != BurrowRole.MEMBER
}

/**
 * A response when retrieving a membership.
 *
 * @param membership A membership to a meeting.
 * @param user The owner of the membership.
 */
@Serializable
data class MembershipResponse(val membership: Membership, val user: User, val profile: Profile)

/**
 * Get all [Burrow]s a [user] has joined.
 *
 * @param user The ID of the user to find all [Burrow]s for.
 */
suspend fun getUserSchedule(user: String): List<BurrowResponse> {
    // Get up to 5 non-project burrows (study/event)
    val nonProjectBurrows = query {
        Memberships.innerJoin(Burrows, { Memberships.burrowID }, { Burrows.id })
            .innerJoin(Users, { Burrows.ownerID }, { Users.id })
            .selectAll()
            .where {
                (Memberships.userID eq user) and // the user's meetings
                    (Memberships.status eq BurrowMemberStatus.JOINED) and // in the meeting
                    (Burrows.endTime greaterEq getTimeMillis()) and // ensure it hasn't ended
                    (Burrows.kind neq BurrowKind.PROJECT) // exclude projects
            }
            .orderBy(Burrows.beginningTime, SortOrder.ASC)
            .limit(5)
            .map { row ->
                BurrowResponse(
                    burrow = Burrow.fromRow(row),
                    burrowAuthor = row[Users.username],
                    membership = Membership.fromRow(row = row),
                    bookmarked = false,
                )
            }
            .toList()
    }

    // Get all active projects (not limited)
    val projectBurrows = query {
        Memberships.innerJoin(Burrows, { Memberships.burrowID }, { Burrows.id })
            .innerJoin(Users, { Burrows.ownerID }, { Users.id })
            .selectAll()
            .where {
                (Memberships.userID eq user) and                            // the user's meetings
                    (Memberships.status eq BurrowMemberStatus.JOINED) and   // in the meeting
                    (Burrows.endTime greaterEq getTimeMillis()) and         // ensure it hasn't ended
                    (Burrows.kind eq BurrowKind.PROJECT)                    // only projects
            }
            .orderBy(Burrows.endTime, SortOrder.ASC) // sort by due date
            .take(5)
            .map { row ->
                BurrowResponse(
                    burrow = Burrow.fromRow(row),
                    burrowAuthor = row[Users.username],
                    membership = Membership.fromRow(row = row),
                    bookmarked = false,
                )
            }
            .toList()
    }

    // Combine: projects first, then other burrows sorted by beginning time
    return projectBurrows + nonProjectBurrows
}

/**
 * Get all [Burrow]s a [user] has bookmarked.
 *
 * @param user The ID of the user to find all [Burrow]s for.
 */
suspend fun getUserBookmarks(user: String): List<BurrowResponse> {
    val result = query {
        Memberships.innerJoin(Burrows, { Memberships.burrowID }, { Burrows.id })
            .innerJoin(Users, { Burrows.ownerID }, { Users.id })
            .innerJoin(Bookmarks, { Memberships.burrowID }, { Bookmarks.meetingID })
            .selectAll()
            .where {
                (Memberships.userID eq user) and // the user's meetings
                    (Memberships.status eq BurrowMemberStatus.JOINED) and // in the meeting
                    (Burrows.endTime greaterEq getTimeMillis()) and // ensure it hasn't ended
                    (Bookmarks.userID eq user)
            }
            .orderBy(Burrows.beginningTime, SortOrder.DESC)
            .limit(3)
            .map { row ->
                BurrowResponse(
                    burrow = Burrow.fromRow(row),
                    burrowAuthor = row[Users.username],
                    membership = Membership.fromRow(row = row),
                    bookmarked = true,
                )
            }
            .toList()
    }

    return result
}

/**
 * Get a [Membership] instance.
 *
 * @param userID The ID of the user.
 * @param burrowID The ID of the Burrow.
 */
suspend fun getMembership(userID: String, burrowID: String): Membership? = query {
    Memberships.selectAll()
        .where { Memberships.userID eq userID and (Memberships.burrowID eq burrowID) }
        .firstOrNull()
        ?.let { Membership.fromRow(it) }
}

/**
 * CHeck if a user is a member of [burrowID].
 *
 * @param burrowID The ID of the meeting to check.
 */
suspend infix fun String.isMemberOf(burrowID: String): Boolean =
    getMembership(this, burrowID) != null

/** Check if a user is a moderator of [burrowID] */
suspend infix fun String.isModeratorOf(burrowID: String): Boolean {
    val role = getMembership(this, burrowID)?.role

    return role == BurrowRole.MEMBER || role == BurrowRole.HOST
}

/** Require that the authorized user is at least a moderator of [burrowID]. */
suspend fun ApplicationCall.requireModerator(burrowID: String) {
    if (!(userID isModeratorOf burrowID)) throw InvalidAuthorization()
}

/**
 * Get all a [userId]'s [Membership]s.
 *
 * @param userId The user to get the memberships for.
 * @return A map of the meeting ID to the [userId]'s [Membership].
 */
suspend fun getMemberships(userId: String): Map<String, Membership> = query {
    Memberships.selectAll()
        .where { Memberships.userID eq userId }
        .toList()
        .associate { row -> row[Memberships.burrowID] to Membership.fromRow(row) }
}

/**
 * Unban a [user] from a [meeting]
 *
 * @param user The ID of the user to unban in the meeting.
 * @param meeting The ID of the meeting to unban the user in.
 * @param Error If the user is not banned in the meeting.
 */
suspend fun unBanUser(user: String, meeting: String) {
    val userMembership = query {
        Memberships.selectAll()
            .where {
                (Memberships.userID eq user) and
                    (Memberships.burrowID eq meeting) and
                    (Memberships.status eq BurrowMemberStatus.BANNED)
            }
            .firstOrNull()
    }

    if (userMembership == null) {
        throw Error(400, "User has not been banned in this meeting!")
    }

    query {
        // change from banned to left, meaning they can now join back :)
        Memberships.update(where = { Memberships.userID eq user }) {
            it[status] = BurrowMemberStatus.LEFT
        }
    }
}

/**
 * Ban a [userID] from a [burrowID]
 *
 * @param requestingUserID The user requesting to ban [userID].
 * @param userID The ID of the user to ban in the meeting.
 * @param burrowID The ID of the meeting to ban the user in.
 * @param Error If the user is not in the meeting, they're the host, or a moderator and [userID] is
 *   a moderator.
 */
suspend fun banUser(requestingUserID: String, userID: String, burrowID: String) {
    val userMembership = getMembership(userID, burrowID)
    val moderatorMembership = getMembership(requestingUserID, burrowID)

    if (userMembership == null || moderatorMembership == null) {
        throw Error(400, "User is not in this meeting!")
    }

    if (moderatorMembership.role == userMembership.role) {
        throw Error(400, "You cannot ban other moderators!")
    }

    // remove them
    BurrowSync.leave(burrowID, userID, true)

    query {
        Memberships.update(where = { Memberships.userID eq userID }) {
            it[role] = BurrowRole.MEMBER
            it[status] = BurrowMemberStatus.BANNED
            it[leftAt] = getTimeMillis()
        }
    }
}

/**
 * Change the role of a user in a meeting.
 *
 * @param meetingId The ID of the meeting to change the role in.
 * @param userId The user to adjust the role of.
 * @param role The new role.
 */
suspend fun changeRole(meetingId: String, userId: String, role: BurrowRole) {
    val userMembership = query {
        Memberships.selectAll()
            .where { Memberships.userID eq userId and (Memberships.burrowID eq meetingId) }
            .firstOrNull()
    }

    if (userMembership == null) {
        throw Error(400, "User is not in this meeting!")
    }

    query {
        Memberships.update(where = { Memberships.userID eq userId }) { it[Memberships.role] = role }
    }
}

/**
 * Have a [userID] leave a [meetingID].
 *
 * @param userID The ID of the user leaving the Burrow.
 * @param meetingID The ID of the Burrow to leave.
 * @throws Error If the user is not in the meeting or they're the host.
 */
suspend fun leaveBurrow(userID: String, meetingID: String) {
    val meeting = getBurrow(meetingID) ?: throw Error(404, "Meeting not found!")

    // ensure meeting hasn't ended
    if (getTimeMillis() > meeting.endTime) throw Error(400, "This meeting has already ended.")

    val existingMembership = query {
        Memberships.selectAll()
            .where { (Memberships.userID eq userID) and (Memberships.burrowID eq meetingID) }
            .firstOrNull()
    }

    // they have no membership, not in the meeting, or they're not JOINED status
    if (
        existingMembership == null ||
            existingMembership[Memberships.status] != BurrowMemberStatus.JOINED
    ) {
        throw Error(404, "You aren't in this meeting!")
    }

    // a host cannot leave their group sadly ;(
    if (existingMembership[Memberships.role] == BurrowRole.HOST) {
        throw Error(404, "A host cannot leave their own meeting!")
    }

    // allow the user to leave
    query {
        Memberships.update(
            where = { (Memberships.userID eq userID) and (Memberships.burrowID eq meetingID) }
        ) {
            it[role] = BurrowRole.MEMBER
            it[status] = BurrowMemberStatus.LEFT
            it[leftAt] = getTimeMillis()
        }

        JoinRequests.deleteWhere { JoinRequests.requesterID eq userID }

        // un-schedule their notification
        onUserLeaveMeeting(userID, meetingID)
    }

    // cancel the user's socket connection if they have one
    BurrowSync.leave(meetingID, userID, closeSession = true)

    // the user who was waitlisted last gets first dibs
    query {
        val earliestWaitlist =
            Memberships.selectAll()
                .where {
                    (Memberships.burrowID eq meetingID) and
                        (Memberships.status eq BurrowMemberStatus.WAITLISTED)
                }
                .orderBy(Memberships.joinedAt, SortOrder.DESC)
                .firstOrNull()

        if (earliestWaitlist != null) {
            val waitingUser = earliestWaitlist[Memberships.userID]

            Memberships.update({
                (Memberships.userID eq waitingUser) and (Memberships.burrowID eq meetingID)
            }) {
                // welcome to the club :)
                it[Memberships.status] = BurrowMemberStatus.JOINED
            }

            // notification that they've joined
            createNotification("Joined Meeting", "You've been moved off the waitlist!", waitingUser)

            // schedule their upcoming meeting notification
            onUserJoinedMeeting(userID, meetingID)
        }
    }
}

/**
 * Have [userID] join a [burrowID].
 *
 * @param userID The ID of the user joining the Burrow.
 * @param burrowID The ID of the Burrow to join.
 * @throws Error If the user is banned or already joined/waitlisted.
 */
suspend fun joinBurrow(userID: String, burrowID: String) {
    val meeting = getBurrow(burrowID) ?: throw Error(404, "Burrow does not exist.")

    // cannot join
    if (meeting.visibility == BurrowVisibility.PRIVATE) {
        throw Error(404, "Burrow does not exist.")
    }

    if (meeting.requestToJoin) {
        createJoinRequest(userID, burrowID)
        return
    }

    // ensure meeting hasn't ended
    if (getTimeMillis() > meeting.endTime) throw Error(400, "This meeting has already ended.")

    val existingMembership = query {
        Memberships.selectAll()
            .where { (Memberships.userID eq userID) and (Memberships.burrowID eq burrowID) }
            .firstOrNull()
    }

    val count = query {
        Memberships.selectAll().where { (Memberships.burrowID eq burrowID) }.count()
    }

    // if capacity = 0, then there's no limit >:)
    val capacity = query {
        Burrows.select(Burrows.id, Burrows.capacity)
            .where { Burrows.id eq burrowID }
            .first()[Burrows.capacity]
    }

    // if the meeting is full
    // if the capacity is zero, then there's no limit
    val atCapacity = count >= capacity && capacity != 0

    // the user has previously joined this meeting
    if (
        existingMembership != null &&
            existingMembership[Memberships.status] != BurrowMemberStatus.LEFT
    ) {
        // they're banned from the meeting
        if (existingMembership[Memberships.status] == BurrowMemberStatus.BANNED) {
            throw Error(401, "You are not authorized to join this meeting.")
        }

        // they're either already joined, or they're waitlisted; let them know we don't deal
        // that business here.
        throw Error(400, "You currently cannot join this meeting!")
    } else {
        val status = query {
            Memberships.upsert {
                it[this.userID] = userID
                it[this.burrowID] = burrowID
                it[this.joinedAt] = getTimeMillis()
                it[this.role] = BurrowRole.MEMBER

                // status depending on count
                it[this.status] =
                    if (atCapacity) BurrowMemberStatus.WAITLISTED else BurrowMemberStatus.JOINED
            } get (Memberships.status)
        }

        if (status == BurrowMemberStatus.JOINED) onUserJoinedMeeting(userID, burrowID)
    }
}

/** The size of pages in [getAttendees]. */
private const val ATTENDEES_PAGE_SIZE = 5

/**
 * Retrieve all attendees for a meeting.
 *
 * @param burrowID The Burrow to retrieve the attendees.
 * @param page The page of attendees.
 */
suspend fun getAttendees(burrowID: String, page: Int = 1): PaginatedResponse<MembershipResponse> =
    query {
        val query =
            Memberships.innerJoin(Users, { Memberships.userID }, { Users.id })
                .innerJoin(Profiles, { Memberships.userID }, { Profiles.userID })
                .selectAll()
                .where { Memberships.burrowID eq burrowID }

        val itemCount = query.count()

        val attendees =
            query
                .limit(ATTENDEES_PAGE_SIZE)
                .offset(ATTENDEES_PAGE_SIZE * (page - 1L))
                .map { row ->
                    MembershipResponse(
                        Membership.fromRow(row),
                        User.fromRow(row),
                        Profile.fromRow(row),
                    )
                }
                .toList()

        PaginatedResponse(
            page,
            ceil(itemCount / ATTENDEES_PAGE_SIZE.toDouble()).toInt(),
            itemCount,
            attendees,
        )
    }

/**
 * Check if a [userId] is in a [meetingId].
 *
 * @param userId The user to check for.
 * @param meetingId The meeting the user may be in.
 */
suspend fun userInMeeting(userId: String, meetingId: String): Boolean = query {
    Memberships.selectAll()
        .where { (Memberships.userID eq userId) and (Memberships.burrowID eq meetingId) }
        .firstOrNull() != null
}
