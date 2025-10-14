package app.burrow.groups.models

import app.burrow.account.Users
import app.burrow.groups.Meetings
import app.burrow.groups.bookmarks.Bookmark
import app.burrow.groups.bookmarks.Bookmarks
import app.burrow.groups.membership.Membership
import app.burrow.groups.membership.Memberships
import app.burrow.groups.sync.block.BlockStates
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.time.Instant
import java.time.ZoneId
import java.util.UUID
import kotlinx.datetime.toKotlinLocalDate
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.alias
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.countDistinct
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.innerJoin
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.leftJoin
import org.jetbrains.exposed.sql.lowerCase
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update

/**
 * A group meeting.
 *
 * @param id The unique ID of this meeting.
 * @param owner The owner of the group.
 * @param title The title of the meeting.
 * @param description The description, or contents, of the meeting.
 * @param location The location of the meeting.
 * @param kind The kind of group.
 * @param beginningTime The time the meeting begins.
 * @param endTime The time the meeting ends.
 * @param tags The tags for the group.
 * @param capacity The maximum amount of people able to be in the meeting.
 * @param joined The amount of students in the meeting.
 * @param waiting The amount of students on the waitlist.
 */
@Serializable
data class GroupMeeting(
    val id: String,
    val owner: String,
    val title: String,
    val description: String,
    val location: String,
    val kind: GroupType,
    val beginningTime: Long,
    val endTime: Long,
    val tags: Set<String>,
    val creationDate: Long,
    val capacity: Int,
    val joined: Long,
    val waiting: Long,
) {
    companion object {
        /**
         * Form a [GroupMeeting] from a [ResultRow].
         *
         * @param row A [ResultRow] containing details on a [GroupMeeting]
         * @param joined The amount of users who have joined.
         * @param waiting The amount of user's on the waitlist.
         */
        fun fromRow(row: ResultRow, joined: Long = -1, waiting: Long = -1): GroupMeeting =
            GroupMeeting(
                id = row[Meetings.id],
                owner = row[Meetings.owner],
                title = row[Meetings.title],
                description = row[Meetings.description],
                location = row[Meetings.location],
                kind = row[Meetings.kind],
                creationDate = row[Meetings.creationDate],
                endTime = row[Meetings.endTime],
                beginningTime = row[Meetings.beginningTime],
                capacity = row[Meetings.capacity],
                tags = Json.decodeFromString<Set<String>>(row[Meetings.tags]),
                joined = joined,
                waiting = waiting,
            )
    }
}

/**
 * Create a group meeting.
 *
 * @param id The ID of the owner.
 * @param meeting The submitted details.
 */
suspend fun createGroupMeeting(id: String, meeting: SubmittedGroupMeeting): GroupMeeting {
    val groupMeeting =
        GroupMeeting(
            id = UUID.randomUUID().toString().replace("-", "").take(8),
            owner = id,
            title = meeting.title,
            description = meeting.description,
            location = meeting.location,
            kind = meeting.kind,
            beginningTime = meeting.beginningTime,
            endTime = meeting.endTime,
            tags = meeting.tags,
            creationDate = getTimeMillis(),
            capacity = meeting.capacity,
            waiting = 0,
            joined = 0,
        )

    query {
        Meetings.insert {
            it[Meetings.id] = groupMeeting.id
            it[owner] = groupMeeting.owner
            it[title] = groupMeeting.title
            it[description] = groupMeeting.description
            it[location] = groupMeeting.location
            it[kind] = groupMeeting.kind
            it[beginningTime] = groupMeeting.beginningTime
            it[endTime] = groupMeeting.endTime
            it[tags] = Json.encodeToString(groupMeeting.tags)
            it[creationDate] = groupMeeting.creationDate
            it[capacity] = groupMeeting.capacity
        }

        Memberships.insert {
            it[Memberships.meetingId] = groupMeeting.id
            it[Memberships.userId] = groupMeeting.owner
            it[Memberships.role] = MeetingRole.HOST
            it[Memberships.status] = MeetingMemberStatus.JOINED
            it[Memberships.joinedAt] = getTimeMillis()
        }

        // by default, enable CHAT
        BlockStates.insert {
            it[BlockStates.meetingId] = groupMeeting.id
            it[BlockStates.block] = "CHAT"
            it[BlockStates.data] = "{}"
        }
    }

    return groupMeeting
}

/**
 * Get a meeting by its [id].
 *
 * @param id The ID of the meeting.
 */
suspend fun getMeeting(id: String): GroupMeeting? = query {
    Meetings.selectAll().where { Meetings.id eq id }.firstOrNull()?.let { GroupMeeting.fromRow(it) }
}

/**
 * Get a [GroupMeetingResponse] by its ID.
 *
 * @param id The ID of the meeting.
 * @param user The ID of the user requesting, to combine the membership information.
 */
suspend fun getMeetingResponse(id: String, user: String): GroupMeetingResponse? = query {
    val joinedAlias = Memberships.alias("m_joined")
    val waitingAlias = Memberships.alias("m_waiting")

    val joinedCountExpr = joinedAlias[Memberships.userId].countDistinct()
    val waitingCountExpr = waitingAlias[Memberships.userId].countDistinct()

    val meeting =
        Meetings.innerJoin(Users, { Meetings.owner }, { Users.googleID })
            .leftJoin(
                joinedAlias,
                { Meetings.id },
                { joinedAlias[Memberships.meetingId] },
                additionalConstraint = {
                    joinedAlias[Memberships.status] eq MeetingMemberStatus.JOINED
                },
            )
            .leftJoin(
                waitingAlias,
                { Meetings.id },
                { waitingAlias[Memberships.meetingId] },
                additionalConstraint = {
                    waitingAlias[Memberships.status] eq MeetingMemberStatus.WAITLISTED
                },
            )
            .select(
                Meetings.columns +
                    listOf(Users.name, Users.googleID, joinedCountExpr, waitingCountExpr)
            )
            .where { Meetings.id eq id }
            .groupBy(*Meetings.columns.toTypedArray(), Users.name, Users.googleID)
            .orderBy(Meetings.beginningTime, SortOrder.ASC)
            .firstOrNull() ?: return@query null

    val membership =
        Memberships.selectAll()
            .where { (Memberships.meetingId eq id) and (Memberships.userId eq user) }
            .firstOrNull()
            ?.let { Membership.fromRow(it) }

    val bookmark =
        Bookmarks.selectAll()
            .where { (Bookmarks.meetingId eq id) and (Bookmarks.userId eq user) }
            .firstOrNull() != null

    val joinedCount = meeting[joinedCountExpr]
    val waitingCount = meeting[waitingCountExpr]

    GroupMeetingResponse(
        GroupMeeting.fromRow(meeting, joinedCount, waitingCount),
        meeting[Users.name],
        membership,
        bookmark,
    )
}

/**
 * Delete a meeting by its ID.
 *
 * @param id The ID of the meeting to delete.
 */
suspend fun deleteMeeting(id: String) = query { Meetings.deleteWhere { Meetings.id eq id } }

/**
 * Update a meeting by its [id].
 *
 * @param id The ID of the meeting to update.
 * @param meeting The updated contents of the meeting.
 */
suspend fun updateMeeting(id: String, meeting: SubmittedGroupMeeting) = query {
    Meetings.update({ Meetings.id eq id }) {
        it[Meetings.title] = meeting.title
        it[Meetings.description] = meeting.description
        it[Meetings.location] = meeting.location
        it[Meetings.beginningTime] = meeting.beginningTime
        it[Meetings.endTime] = meeting.endTime
        it[Meetings.tags] = Json.encodeToString(meeting.tags)
        it[Meetings.capacity] = meeting.capacity
    }
}

/**
 * Retrieve all [GroupMeeting]s.
 *
 * @param user The requesting user. This allows for the [app.burrow.groups.membership.Membership] to
 *   be present in the response. If this is not present, it will be treated as a guest user.
 * @param type The type of group. Leave null for all.
 */
suspend fun getMeetings(user: String? = null, type: GroupType? = null): List<GroupMeetingResponse> {
    val meetings: Map<GroupMeeting, String> = query {
        var expr: Op<Boolean> = (Meetings.endTime greaterEq getTimeMillis())

        if (type != null) {
            expr = (expr) and (Meetings.kind eq type)
        }

        val joinedAlias = Memberships.alias("m_joined")
        val waitingAlias = Memberships.alias("m_waiting")

        val joinedCountExpr = joinedAlias[Memberships.userId].countDistinct()
        val waitingCountExpr = waitingAlias[Memberships.userId].countDistinct()

        Meetings.innerJoin(Users, { Meetings.owner }, { Users.googleID })
            .leftJoin(
                joinedAlias,
                { Meetings.id },
                { joinedAlias[Memberships.meetingId] },
                additionalConstraint = {
                    joinedAlias[Memberships.status] eq MeetingMemberStatus.JOINED
                },
            )
            .leftJoin(
                waitingAlias,
                { Meetings.id },
                { waitingAlias[Memberships.meetingId] },
                additionalConstraint = {
                    waitingAlias[Memberships.status] eq MeetingMemberStatus.WAITLISTED
                },
            )
            .select(
                Meetings.columns +
                    listOf(Users.name, Users.googleID, joinedCountExpr, waitingCountExpr)
            )
            .where(expr)
            .groupBy(*Meetings.columns.toTypedArray(), Users.name, Users.googleID)
            .orderBy(Meetings.beginningTime, SortOrder.ASC)
            .associate { row ->
                val joinedCount = row[joinedCountExpr]
                val waitingCount = row[waitingCountExpr]

                GroupMeeting.fromRow(row, joinedCount, waitingCount) to row[Users.name]
            }
    }

    // guest user
    if (user == null || user.isBlank()) {
        return meetings.map { (meeting) ->
            GroupMeetingResponse(meeting = meeting, "", membership = null, bookmarked = false)
        }
    }

    val membershipByMeetingId: Map<String, Membership> = query {
        val ids = meetings.map { (meeting) -> meeting.id }

        if (ids.isEmpty()) return@query emptyMap()

        Memberships.selectAll()
            .where { (Memberships.userId eq user) and (Memberships.meetingId inList ids) }
            .associate { row -> row[Memberships.meetingId] to Membership.fromRow(row) }
    }

    val bookmarksByMeetingId: Map<String, Bookmark> = query {
        val ids = meetings.map { (meeting) -> meeting.id }

        if (ids.isEmpty()) return@query emptyMap()

        Bookmarks.selectAll()
            .where { (Bookmarks.userId eq user) and (Bookmarks.meetingId inList ids) }
            .associate { row -> row[Bookmarks.meetingId] to Bookmark.fromRow(row) }
    }

    return meetings.map { (meeting, author) ->
        GroupMeetingResponse(
            meeting = meeting,
            meetingAuthor = author,
            membership = membershipByMeetingId[meeting.id],
            bookmarked = bookmarksByMeetingId.containsKey(meeting.id),
        )
    }
}

/**
 * Search through all group meetings.
 *
 * @param query The search query. This will search through tags, title, description, location, etc..
 */
suspend fun searchMeetings(search: String, date: Long? = null): List<GroupMeetingResponse> {
    val term = search.trim()

    val pattern = "%" + term.lowercase().replace("%", "\\%").replace("_", "\\_") + "%"

    val meetings: Map<GroupMeeting, String> = query {
        var expr: Op<Boolean> =
            if (date == null) {
                // Default: only future or ongoing meetings
                (Meetings.endTime greaterEq getTimeMillis())
            } else {
                val zone = ZoneId.systemDefault()
                val localDate = Instant.ofEpochMilli(date).atZone(zone).toLocalDate()

                println(localDate.toKotlinLocalDate().toString())

                val startOfDayMillis = localDate.atStartOfDay(zone).toInstant().toEpochMilli()
                val endOfDayMillis =
                    localDate
                        .atTime(23, 59, 59, 999_000_000)
                        .atZone(zone)
                        .toInstant()
                        .toEpochMilli()

                (Meetings.beginningTime greaterEq startOfDayMillis) and
                    (Meetings.beginningTime lessEq endOfDayMillis)
            }

        if (term.trim().isNotBlank())
            expr =
                expr and
                    ((Meetings.title.lowerCase() like pattern) or
                        (Meetings.description.lowerCase() like pattern) or
                        (Meetings.location.lowerCase() like pattern) or
                        (Meetings.tags.lowerCase() like pattern))

        Meetings.innerJoin(Users, { Meetings.owner }, { Users.googleID })
            .selectAll()
            .where { expr }
            .orderBy(Meetings.beginningTime, SortOrder.ASC)
            .associate { row -> GroupMeeting.fromRow(row) to row[Users.name] }
    }

    return meetings.map { (meeting, author) ->
        GroupMeetingResponse(
            meeting = meeting,
            meetingAuthor = author,
            membership = null,
            bookmarked = false,
        )
    }
}
