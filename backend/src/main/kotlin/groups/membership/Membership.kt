package app.burrow.groups.membership

import app.burrow.ServerError
import app.burrow.account.Users
import app.burrow.account.models.User
import app.burrow.groups.Meetings
import app.burrow.groups.models.GroupMeeting
import app.burrow.groups.models.GroupMeetingResponse
import app.burrow.groups.models.MeetingMemberStatus
import app.burrow.groups.models.MeetingRole
import app.burrow.notifications.createNotification
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.innerJoin
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update

/** A membership to a [app.burrow.groups.models.GroupMeeting]. */
@Serializable
data class Membership(
    val meetingId: String,
    val userId: String,
    val role: MeetingRole,
    val status: MeetingMemberStatus,
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
                meetingId = row[Memberships.meetingId],
                userId = row[Memberships.userId],
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

    return membership != null && membership.role != MeetingRole.MEMBER
}

/**
 * A response when retrieving a membership.
 *
 * @param membership A membership to a meeting.
 * @param user The owner of the membership.
 */
@Serializable data class MembershipResponse(val membership: Membership, val user: User)

/**
 * Get all [GroupMeeting]s a [user] has joined.
 *
 * @param user The ID of the user to find all [GroupMeeting]s for.
 */
suspend fun getUserMeetings(user: String): List<GroupMeetingResponse> {
    val result = query {
        Memberships.innerJoin(Meetings, { Memberships.meetingId }, { Meetings.id })
            .innerJoin(Users, { Meetings.owner }, { Users.googleID })
            .selectAll()
            .where {
                (Memberships.userId eq user) and // the user's meetings
                    (Memberships.status eq MeetingMemberStatus.JOINED) and // in the meeting
                    (Meetings.endTime greaterEq getTimeMillis()) // ensure it hasn't ended
            }
            .orderBy(Meetings.beginningTime, SortOrder.DESC)
            .limit(3)
            .toList()
    }

    return result.map { row ->
        GroupMeetingResponse(
            meeting = GroupMeeting.fromRow(row),
            meetingAuthor = row[Users.name],
            membership = Membership.fromRow(row = row),
            bookmarked = false,
        )
    }
}

/**
 * Get a [Membership] instance.
 *
 * @param userId The ID of the user.
 * @param meetingId The ID of the meeting.
 */
suspend fun getMembership(userId: String, meetingId: String): Membership? = query {
    Memberships.selectAll()
        .where { Memberships.userId eq userId and (Memberships.meetingId eq meetingId) }
        .firstOrNull()
        ?.let { Membership.fromRow(it) }
}

/**
 * Unban a [user] from a [meeting]
 *
 * @param user The ID of the user to unban in the meeting.
 * @param meeting The ID of the meeting to unban the user in.
 * @param ServerError If the user is not banned in the meeting.
 */
suspend fun unBanUser(user: String, meeting: String) {
    val userMembership = query {
        Memberships.selectAll()
            .where {
                (Memberships.userId eq user) and
                    (Memberships.meetingId eq meeting) and
                    (Memberships.status eq MeetingMemberStatus.BANNED)
            }
            .firstOrNull()
    }

    if (userMembership == null) {
        throw ServerError(400, "User has not been banned in this meeting!")
    }

    query {
        // change from banned to left, meaning they can now join back :)
        Memberships.update(where = { Memberships.userId eq user }) {
            it[status] = MeetingMemberStatus.LEFT
        }
    }
}

/**
 * Ban a [user] from a [meeting]
 *
 * @param moderator The user requesting to ban [user].
 * @param user The ID of the user to ban in the meeting.
 * @param meeting The ID of the meeting to ban the user in.
 * @param ServerError If the user is not in the meeting, they're the host, or a moderator and [user]
 *   is a moderator.
 */
suspend fun banUser(moderator: String, user: String, meeting: String) {
    val userMembership =
        query {
                Memberships.selectAll().where {
                    Memberships.userId eq user and (Memberships.meetingId eq meeting)
                }
            }
            .firstOrNull()

    val moderatorMembership =
        query {
                Memberships.selectAll().where {
                    Memberships.userId eq moderator and (Memberships.meetingId eq meeting)
                }
            }
            .firstOrNull()

    if (userMembership == null || moderatorMembership == null) {
        throw ServerError(400, "User is not in this meeting!")
    }

    // moderators cannot ban moderators
    if (moderatorMembership[Memberships.role] == userMembership[Memberships.role]) {
        throw ServerError(400, "You cannot ban other moderators!")
    }

    query {
        Memberships.update(where = { Memberships.userId eq user }) {
            it[role] = MeetingRole.MEMBER
            it[status] = MeetingMemberStatus.BANNED
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
suspend fun changeRole(meetingId: String, userId: String, role: MeetingRole) {
    val userMembership = query {
        Memberships.selectAll()
            .where { Memberships.userId eq userId and (Memberships.meetingId eq meetingId) }
            .firstOrNull()
    }

    if (userMembership == null) {
        throw ServerError(400, "User is not in this meeting!")
    }

    query {
        Memberships.update(where = { Memberships.userId eq userId }) { it[Memberships.role] = role }
    }
}

/**
 * Have a [user] leave a [meeting].
 *
 * @param user The ID of the user leaving the meeting.
 * @param meeting The ID of the meeting to leave.
 * @throws ServerError If the user is not in the meeting or they're the host.
 */
suspend fun leaveMeeting(user: String, meeting: String) {
    val existingMembership = query {
        Memberships.selectAll()
            .where { (Memberships.userId eq user) and (Memberships.meetingId eq meeting) }
            .firstOrNull()
    }

    // they have no membership, not in the meeting, or they're not JOINED status
    if (
        existingMembership == null ||
            existingMembership[Memberships.status] != MeetingMemberStatus.JOINED
    ) {
        throw ServerError(404, "You aren't in this meeting!")
    }

    // a host cannot leave their group sadly ;(
    if (existingMembership[Memberships.role] == MeetingRole.HOST) {
        throw ServerError(404, "A host cannot leave their own meeting!")
    }

    query {
        Memberships.update(where = { Memberships.userId eq user }) {
            it[role] = MeetingRole.MEMBER
            it[status] = MeetingMemberStatus.LEFT
            it[leftAt] = getTimeMillis()
        }
    }

    // the user who was waitlisted last gets first dibs
    query {
        val earliestWaitlist =
            Memberships.selectAll()
                .where {
                    (Memberships.meetingId eq meeting) and
                        (Memberships.status eq MeetingMemberStatus.WAITLISTED)
                }
                .orderBy(Memberships.joinedAt, SortOrder.DESC)
                .firstOrNull()

        if (earliestWaitlist != null) {
            val waitingUser = earliestWaitlist[Memberships.userId]

            Memberships.update({
                (Memberships.userId eq waitingUser) and (Memberships.meetingId eq meeting)
            }) {
                // welcome to the club :)
                it[Memberships.status] = MeetingMemberStatus.JOINED
            }

            // notification that they've joined
            createNotification("Joined Meeting", "You've been moved off the waitlist!", waitingUser)
        }
    }
}

/**
 * Have [user] join a [meeting].
 *
 * @param user The ID of the user joining the meeting.
 * @param meeting The ID of the meeting to join.
 * @throws ServerError If the user is banned or already joined/waitlisted.
 */
suspend fun joinMeeting(user: String, meeting: String) {
    val existingMembership = query {
        Memberships.selectAll()
            .where { (Memberships.userId eq user) and (Memberships.meetingId eq meeting) }
            .firstOrNull()
    }

    val count = query {
        Memberships.selectAll().where { (Memberships.meetingId eq meeting) }.count()
    }

    // if capacity = 0, then there's no limit >:)
    val capacity = query {
        Meetings.select(Meetings.id, Meetings.capacity)
            .where { Meetings.id eq meeting }
            .first()[Meetings.capacity]
    }

    // the user already has seen this place..
    if (existingMembership != null) {
        when {
            // they're banned, oh no!
            existingMembership[Memberships.status] == MeetingMemberStatus.BANNED -> {
                throw ServerError(401, "You are not authorized to join this meeting.")
            }

            // waitlist previous
            existingMembership[Memberships.status] == MeetingMemberStatus.LEFT &&
                (count >= capacity && capacity != 0) -> {
                query {
                    Memberships.update({
                        (Memberships.userId eq user) and (Memberships.meetingId eq meeting)
                    }) {
                        it[status] = MeetingMemberStatus.WAITLISTED
                        it[leftAt] = null
                        it[joinedAt] = getTimeMillis()
                    }
                }
            }

            // previously joined, ok
            existingMembership[Memberships.status] == MeetingMemberStatus.LEFT -> {
                query {
                    Memberships.update({
                        (Memberships.userId eq user) and (Memberships.meetingId eq meeting)
                    }) {
                        it[status] = MeetingMemberStatus.JOINED
                        it[leftAt] = null
                        it[joinedAt] = getTimeMillis()
                    }
                }
            }

            // they're either already joined, or they're waitlisted; let them know we don't deal
            // that business here.
            else -> throw ServerError(400, "You currently cannot join this meeting!")
        }
    } else {
        query {
            Memberships.insert {
                it[userId] = user
                it[meetingId] = meeting
                it[joinedAt] = getTimeMillis()
                // status depending on count
                it[status] =
                    if (count >= capacity && capacity != 0) MeetingMemberStatus.WAITLISTED
                    else MeetingMemberStatus.JOINED
                it[role] = MeetingRole.MEMBER
            }
        }
    }
}

/**
 * Retrieve all attendees for a meeting.
 *
 * @param meetingId The meeting to retrieve the attendees.
 */
suspend fun getAttendees(meetingId: String): List<MembershipResponse> {
    val attendees = query {
        Memberships.innerJoin(Users, { Memberships.userId }, { Users.googleID })
            .selectAll()
            .where { Memberships.meetingId eq meetingId }
            .map { row -> MembershipResponse(Membership.fromRow(row), User.fromRow(row)) }
    }

    return attendees
}

/**
 * Check if a [userId] is in a [meetingId].
 *
 * @param userId The user to check for.
 * @param meetingId The meeting the user may be in.
 */
suspend fun userInMeeting(userId: String, meetingId: String): Boolean = query {
    Memberships.selectAll()
        .where { (Memberships.userId eq userId) and (Memberships.meetingId eq meetingId) }
        .firstOrNull() != null
}
