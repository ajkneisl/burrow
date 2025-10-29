package app.burrow.groups.membership

import app.burrow.account.Users
import app.burrow.account.models.User
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.errors.ServerError
import app.burrow.groups.Meetings
import app.burrow.groups.bookmarks.Bookmarks
import app.burrow.groups.models.GroupMeeting
import app.burrow.groups.models.GroupMeetingResponse
import app.burrow.groups.models.MeetingMemberStatus
import app.burrow.groups.models.MeetingRole
import app.burrow.groups.models.getMeeting
import app.burrow.notifications.createNotification
import app.burrow.notifications.onUserJoinedMeeting
import app.burrow.notifications.onUserLeaveMeeting
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

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
                meetingId = row[Memberships.meetingID],
                userId = row[Memberships.userID],
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
@Serializable
data class MembershipResponse(val membership: Membership, val user: User, val profile: Profile)

/**
 * Get all [GroupMeeting]s a [user] has joined.
 *
 * @param user The ID of the user to find all [GroupMeeting]s for.
 */
suspend fun getUserMeetings(user: String): List<GroupMeetingResponse> {
    val result = query {
        Memberships.innerJoin(Meetings, { Memberships.meetingID }, { Meetings.id })
            .innerJoin(Users, { Meetings.owner }, { Users.id })
            .selectAll()
            .where {
                (Memberships.userID eq user) and // the user's meetings
                    (Memberships.status eq MeetingMemberStatus.JOINED) and // in the meeting
                    (Meetings.endTime greaterEq getTimeMillis()) // ensure it hasn't ended
            }
            .orderBy(Meetings.beginningTime, SortOrder.ASC)
            .limit(3)
            .map { row ->
                GroupMeetingResponse(
                    meeting = GroupMeeting.fromRow(row),
                    meetingAuthor = row[Users.username],
                    membership = Membership.fromRow(row = row),
                    bookmarked = false,
                )
            }
            .toList()
    }

    return result
}

/**
 * Get all [GroupMeeting]s a [user] has bookmarked.
 *
 * @param user The ID of the user to find all [GroupMeeting]s for.
 */
suspend fun getUserBookmarks(user: String): List<GroupMeetingResponse> {
    val result = query {
        Memberships.innerJoin(Meetings, { Memberships.meetingID }, { Meetings.id })
            .innerJoin(Users, { Meetings.owner }, { Users.id })
            .innerJoin(Bookmarks, { Memberships.meetingID }, { Bookmarks.meetingId })
            .selectAll()
            .where {
                (Memberships.userID eq user) and // the user's meetings
                    (Memberships.status eq MeetingMemberStatus.JOINED) and // in the meeting
                    (Meetings.endTime greaterEq getTimeMillis()) and // ensure it hasn't ended
                    (Bookmarks.userId eq user)
            }
            .orderBy(Meetings.beginningTime, SortOrder.DESC)
            .limit(3)
            .map { row ->
                GroupMeetingResponse(
                    meeting = GroupMeeting.fromRow(row),
                    meetingAuthor = row[Users.username],
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
 * @param userId The ID of the user.
 * @param meetingId The ID of the meeting.
 */
suspend fun getMembership(userId: String, meetingId: String): Membership? = query {
    Memberships.selectAll()
        .where { Memberships.userID eq userId and (Memberships.meetingID eq meetingId) }
        .firstOrNull()
        ?.let { Membership.fromRow(it) }
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
        .associate { row -> row[Memberships.meetingID] to Membership.fromRow(row) }
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
                (Memberships.userID eq user) and
                    (Memberships.meetingID eq meeting) and
                    (Memberships.status eq MeetingMemberStatus.BANNED)
            }
            .firstOrNull()
    }

    if (userMembership == null) {
        throw ServerError(400, "User has not been banned in this meeting!")
    }

    query {
        // change from banned to left, meaning they can now join back :)
        Memberships.update(where = { Memberships.userID eq user }) {
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
                    Memberships.userID eq user and (Memberships.meetingID eq meeting)
                }
            }
            .firstOrNull()

    val moderatorMembership =
        query {
                Memberships.selectAll().where {
                    Memberships.userID eq moderator and (Memberships.meetingID eq meeting)
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
        Memberships.update(where = { Memberships.userID eq user }) {
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
            .where { Memberships.userID eq userId and (Memberships.meetingID eq meetingId) }
            .firstOrNull()
    }

    if (userMembership == null) {
        throw ServerError(400, "User is not in this meeting!")
    }

    query {
        Memberships.update(where = { Memberships.userID eq userId }) { it[Memberships.role] = role }
    }
}

/**
 * Have a [userId] leave a [meetingId].
 *
 * @param userId The ID of the user leaving the meeting.
 * @param meetingId The ID of the meeting to leave.
 * @throws ServerError If the user is not in the meeting or they're the host.
 */
suspend fun leaveMeeting(userId: String, meetingId: String) {
    val meeting = getMeeting(meetingId) ?: throw ServerError(404, "Meeting not found!")

    // ensure meeting hasn't ended
    if (getTimeMillis() > meeting.endTime) throw ServerError(400, "This meeting has already ended.")

    val existingMembership = query {
        Memberships.selectAll()
            .where { (Memberships.userID eq userId) and (Memberships.meetingID eq meetingId) }
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

    // allow the user to leave
    query {
        Memberships.update(
            where = { (Memberships.userID eq userId) and (Memberships.meetingID eq meetingId) }
        ) {
            it[role] = MeetingRole.MEMBER
            it[status] = MeetingMemberStatus.LEFT
            it[leftAt] = getTimeMillis()
        }

        // un-schedule their notification
        onUserLeaveMeeting(userId, meetingId)
    }

    // the user who was waitlisted last gets first dibs
    query {
        val earliestWaitlist =
            Memberships.selectAll()
                .where {
                    (Memberships.meetingID eq meetingId) and
                        (Memberships.status eq MeetingMemberStatus.WAITLISTED)
                }
                .orderBy(Memberships.joinedAt, SortOrder.DESC)
                .firstOrNull()

        if (earliestWaitlist != null) {
            val waitingUser = earliestWaitlist[Memberships.userID]

            Memberships.update({
                (Memberships.userID eq waitingUser) and (Memberships.meetingID eq meetingId)
            }) {
                // welcome to the club :)
                it[Memberships.status] = MeetingMemberStatus.JOINED
            }

            // notification that they've joined
            createNotification("Joined Meeting", "You've been moved off the waitlist!", waitingUser)

            // schedule their upcoming meeting notification
            onUserJoinedMeeting(userId, meetingId)
        }
    }
}

/**
 * Have [userId] join a [meetingId].
 *
 * @param userId The ID of the user joining the meeting.
 * @param meetingId The ID of the meeting to join.
 * @throws ServerError If the user is banned or already joined/waitlisted.
 */
suspend fun joinMeeting(userId: String, meetingId: String) {
    val meeting = getMeeting(meetingId) ?: throw ServerError(404, "Meeting does not exist.")

    // ensure meeting hasn't ended
    if (getTimeMillis() > meeting.endTime) throw ServerError(400, "This meeting has already ended.")

    val existingMembership = query {
        Memberships.selectAll()
            .where { (Memberships.userID eq userId) and (Memberships.meetingID eq meetingId) }
            .firstOrNull()
    }

    val count = query {
        Memberships.selectAll().where { (Memberships.meetingID eq meetingId) }.count()
    }

    // if capacity = 0, then there's no limit >:)
    val capacity = query {
        Meetings.select(Meetings.id, Meetings.capacity)
            .where { Meetings.id eq meetingId }
            .first()[Meetings.capacity]
    }

    // if the meeting is full
    // if the capacity is zero, then there's no limit
    val atCapacity = count >= capacity && capacity != 0

    // the user has previously joined this meeting
    if (existingMembership != null) {
        // they're banned from the meeting
        if (existingMembership[Memberships.status] == MeetingMemberStatus.BANNED) {
            throw ServerError(401, "You are not authorized to join this meeting.")
        }

        if (existingMembership[Memberships.status] == MeetingMemberStatus.LEFT) {
            // meeting is full
            if (atCapacity) {
                query {
                    Memberships.update({
                        (Memberships.userID eq userId) and (Memberships.meetingID eq meetingId)
                    }) {
                        it[status] = MeetingMemberStatus.WAITLISTED
                        it[leftAt] = null
                        it[joinedAt] = getTimeMillis()
                    }
                }
            } else {
                query {
                    Memberships.update({
                        (Memberships.userID eq userId) and (Memberships.meetingID eq meetingId)
                    }) {
                        it[status] = MeetingMemberStatus.JOINED
                        it[leftAt] = null
                        it[joinedAt] = getTimeMillis()
                    }
                }

                // schedule notification
                onUserJoinedMeeting(userId, meetingId)
            }

            return
        }

        // they're either already joined, or they're waitlisted; let them know we don't deal
        // that business here.
        throw ServerError(400, "You currently cannot join this meeting!")
    } else {
        val status = query {
            Memberships.insert {
                it[this.userID] = userId
                it[this.meetingID] = meetingId
                it[this.joinedAt] = getTimeMillis()
                it[this.role] = MeetingRole.MEMBER

                // status depending on count
                it[this.status] =
                    if (atCapacity) MeetingMemberStatus.WAITLISTED else MeetingMemberStatus.JOINED
            } get (Memberships.status)
        }

        if (status == MeetingMemberStatus.JOINED) onUserJoinedMeeting(userId, meetingId)
    }
}

/**
 * Retrieve all attendees for a meeting.
 *
 * @param meetingID The meeting to retrieve the attendees.
 */
suspend fun getAttendees(meetingID: String): List<MembershipResponse> {
    val attendees = query {
        Memberships.innerJoin(Users, { Memberships.userID }, { Users.id })
            .innerJoin(Profiles, { Memberships.userID }, { Profiles.userID })
            .selectAll()
            .where { Memberships.meetingID eq meetingID }
            .map { row ->
                MembershipResponse(Membership.fromRow(row), User.fromRow(row), Profile.fromRow(row))
            }
            .toList()
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
        .where { (Memberships.userID eq userId) and (Memberships.meetingID eq meetingId) }
        .firstOrNull() != null
}
