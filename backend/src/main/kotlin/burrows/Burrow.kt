package app.burrow.burrows

import app.burrow.NotFound
import app.burrow.account.Users
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.burrows.bookmarks.Bookmarks
import app.burrow.burrows.invites.JoinRequestStatus
import app.burrow.burrows.invites.getJoinRequest
import app.burrow.burrows.membership.Membership
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.membership.isMemberOf
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowResponse
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.models.BurrowType
import app.burrow.burrows.models.BurrowVisibility
import app.burrow.burrows.models.Burrows
import app.burrow.burrows.models.SubmittedBurrow
import app.burrow.burrows.sync.block.Block
import app.burrow.burrows.sync.block.BlockStates
import app.burrow.notifications.rescheduleNotificationsForMeeting
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.countDistinct
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** A Burrow. */
@Serializable
data class Burrow(
    /** Unique ID of the meeting. */
    val id: String,

    /** The ID of the owner of the meeting. */
    val ownerID: String,

    /** The title of the Burrow. */
    val title: String,

    /** The description of the Burrow. */
    val description: String,

    /** The location of the Burrow. */
    val location: String,

    /** The kind of Burrow. */
    val kind: BurrowType,

    /** The starting time of the Burrow. */
    val beginningTime: Long,

    /** The end time of the Burrow. */
    val endTime: Long,

    /** The tags. */
    val tags: Set<String>,

    /** When the Burrow was created in epoch ms. */
    val creationDate: Long,

    /** How many people are able to be in the Burrow. */
    val capacity: Int,

    /** The visibility. */
    val visibility: BurrowVisibility,

    /**
     * If the user must request to join. This is overridden by [visibility] when it's
     * [BurrowVisibility.PRIVATE].
     */
    val requestToJoin: Boolean,

    /** How many people are in the meeting. */
    val joined: Long,

    /** How many people are waiting to be in the meeting. */
    val waiting: Long,
) {
    companion object {
        /**
         * Form a [Burrow] from a [ResultRow].
         *
         * @param row A [ResultRow] containing details on a [Burrow]
         * @param joined The amount of users who have joined.
         * @param waiting The amount of user's on the waitlist.
         */
        fun fromRow(row: ResultRow, joined: Long = -1, waiting: Long = -1): Burrow =
            Burrow(
                id = row[Burrows.id],
                ownerID = row[Burrows.ownerID],
                title = row[Burrows.title],
                description = row[Burrows.description],
                location = row[Burrows.location],
                kind = row[Burrows.kind],
                creationDate = row[Burrows.creationDate],
                endTime = row[Burrows.endTime],
                beginningTime = row[Burrows.beginningTime],
                capacity = row[Burrows.capacity],
                tags = Json.decodeFromString<Set<String>>(row[Burrows.tags]),
                visibility = row[Burrows.visibility],
                requestToJoin = row[Burrows.requestToJoin],
                joined = joined,
                waiting = waiting,
            )
    }
}

/**
 * Create a study Burrow
 *
 * @param userID The ID of the owner.
 * @param meeting The submitted details.
 */
suspend fun createStudyBurrow(userID: String, meeting: SubmittedBurrow): Burrow {
    val groupMeeting =
        Burrow(
            id = UUID.randomUUID().toString().replace("-", "").take(8),
            ownerID = userID,
            title = meeting.title,
            description = meeting.description,
            location = meeting.location,
            kind = meeting.kind,
            beginningTime = meeting.beginningTime,
            endTime = meeting.endTime,
            tags = meeting.tags,
            creationDate = getTimeMillis(),
            capacity = meeting.capacity,
            visibility = meeting.visibility,
            requestToJoin = meeting.requestToJoin,
            waiting = 0,
            joined = 0,
        )

    query {
        // insert burrow
        Burrows.insert {
            it[Burrows.id] = groupMeeting.id
            it[ownerID] = groupMeeting.ownerID
            it[title] = groupMeeting.title
            it[description] = groupMeeting.description
            it[location] = groupMeeting.location
            it[kind] = groupMeeting.kind
            it[beginningTime] = groupMeeting.beginningTime
            it[endTime] = groupMeeting.endTime
            it[tags] = Json.encodeToString(groupMeeting.tags)
            it[creationDate] = groupMeeting.creationDate
            it[capacity] = groupMeeting.capacity
            it[visibility] = groupMeeting.visibility
            it[requestToJoin] = groupMeeting.requestToJoin
        }

        // insert membership for host
        Memberships.insert {
            it[Memberships.burrowID] = groupMeeting.id
            it[Memberships.userID] = groupMeeting.ownerID
            it[Memberships.role] = BurrowRole.HOST
            it[Memberships.status] = BurrowMemberStatus.JOINED
            it[Memberships.joinedAt] = groupMeeting.creationDate
        }

        // by default, enable CHAT
        BlockStates.insert {
            it[BlockStates.meetingId] = groupMeeting.id
            it[BlockStates.block] = "CHAT"
            it[BlockStates.data] = Block.BlockState.EMPTY
        }
    }

    // schedule notifications
    rescheduleNotificationsForMeeting(groupMeeting.id)

    return groupMeeting
}

/**
 * Get a meeting by its [burrowID].
 *
 * @param burrowID The ID of the meeting.
 */
suspend fun getBurrow(burrowID: String): Burrow? = query {
    Burrows.selectAll().where { Burrows.id eq burrowID }.firstOrNull()?.let { Burrow.fromRow(it) }
}

/**
 * Get a [BurrowResponse] by its ID.
 *
 * @param burrowID The ID of the Burrow.
 * @param requestingUserID The ID of the user requesting, to combine the membership information.
 * @return A [BurrowResponse] with all meeting and user-specific data, or null if meeting not found.
 */
suspend fun getMeetingResponse(burrowID: String, requestingUserID: String?): BurrowResponse? {
    val meetingData =
        query {
            val joinedAlias = Memberships.alias("m_joined")
            val waitingAlias = Memberships.alias("m_waiting")

            val joinedCountExpr = joinedAlias[Memberships.userID].countDistinct()
            val waitingCountExpr = waitingAlias[Memberships.userID].countDistinct()

            Burrows.innerJoin(Users, { Burrows.ownerID }, { Users.id })
                .leftJoin(
                    joinedAlias,
                    { Burrows.id },
                    { joinedAlias[Memberships.burrowID] },
                    additionalConstraint = {
                        joinedAlias[Memberships.status] eq BurrowMemberStatus.JOINED
                    },
                )
                .leftJoin(
                    waitingAlias,
                    { Burrows.id },
                    { waitingAlias[Memberships.burrowID] },
                    additionalConstraint = {
                        waitingAlias[Memberships.status] eq BurrowMemberStatus.WAITLISTED
                    },
                )
                .leftJoin(Profiles, { Burrows.ownerID }, { Profiles.userID })
                .select(
                    Burrows.columns +
                        Profiles.columns +
                        listOf(Users.username, Users.id, joinedCountExpr, waitingCountExpr)
                )
                .where { Burrows.id eq burrowID }
                .groupBy(
                    *Burrows.columns.toTypedArray(),
                    *Profiles.columns.toTypedArray(),
                    Users.username,
                    Users.id,
                )
                .singleOrNull()
                ?.let { row ->
                    val joinedCount = row[joinedCountExpr]
                    val waitingCount = row[waitingCountExpr]
                    val burrow = Burrow.fromRow(row, joinedCount, waitingCount)
                    val authorUsername = row[Users.username]
                    val authorProfile = Profile.fromRow(row)

                    Triple(burrow, authorUsername, authorProfile)
                }
        } ?: return null

    val (burrow, authorUsername, authorProfile) = meetingData

    // if the meeting is private do some checks
    if (burrow.visibility == BurrowVisibility.PRIVATE) {
        val isMember = requestingUserID?.isMemberOf(burrow.id) ?: false

        if (!isMember) throw NotFound()
    }

    // return response without user-specific data if no userID provided
    if (requestingUserID.isNullOrBlank()) {
        return BurrowResponse(
            burrow = burrow,
            burrowAuthor = "Fellow Burrower",
            burrowAuthorProfile = authorProfile,
            membership = null,
            bookmarked = false,
        )
    }

    val (profile, membership, bookmarked) =
        query {
            val profile =
                Profiles.selectAll()
                    .where { Profiles.userID eq requestingUserID }
                    .map { Profile.fromRow(it) }
                    .singleOrNull()

            val membership =
                Memberships.selectAll()
                    .where {
                        (Memberships.userID eq requestingUserID) and
                            (Memberships.burrowID eq burrowID)
                    }
                    .map { Membership.fromRow(it) }
                    .singleOrNull()

            val bookmarked =
                Bookmarks.selectAll()
                    .where {
                        (Bookmarks.userID eq requestingUserID) and (Bookmarks.meetingID eq burrowID)
                    }
                    .firstOrNull() != null

            Triple(profile, membership, bookmarked)
        }

    val requestedToJoin =
        if (
            membership?.status != BurrowMemberStatus.JOINED &&
                membership?.status != BurrowMemberStatus.WAITLISTED
        ) {
            getJoinRequest(requestingUserID, burrowID)?.status == JoinRequestStatus.PENDING
        } else null

    // Build highlighted tags based on user's classes
    val highlightedTags = buildList {
        burrow.tags.forEachIndexed { index, tag ->
            val normalizedTag = tag.replace(Regex("[\\s_-]"), "").lowercase()

            profile
                ?.classes
                ?.map { className -> className.replace(Regex("[\\s_-]"), "").lowercase() }
                ?.filter { className -> className == normalizedTag }
                ?.forEach { _ -> add(index) }
        }
    }

    return BurrowResponse(
        burrow = burrow,
        burrowAuthor = authorUsername,
        burrowAuthorProfile = authorProfile,
        membership = membership,
        requestedToJoin = requestedToJoin,
        bookmarked = bookmarked,
        highlightedTags = highlightedTags,
    )
}

/**
 * Delete a meeting by its ID.
 *
 * @param id The ID of the meeting to delete.
 */
suspend fun deleteMeeting(id: String) = query { Burrows.deleteWhere { Burrows.id eq id } }

/**
 * Update a meeting by its [meetingId].
 *
 * @param meetingId The ID of the meeting to update.
 * @param meeting The updated contents of the meeting.
 */
suspend fun updatedBurrow(meetingId: String, meeting: SubmittedBurrow) = query {
    Burrows.update({ Burrows.id eq meetingId }) {
        it[Burrows.title] = meeting.title
        it[Burrows.description] = meeting.description
        it[Burrows.location] = meeting.location
        it[Burrows.beginningTime] = meeting.beginningTime
        it[Burrows.endTime] = meeting.endTime
        it[Burrows.tags] = Json.encodeToString(meeting.tags)
        it[Burrows.capacity] = meeting.capacity
        it[Burrows.visibility] = meeting.visibility
        it[Burrows.requestToJoin] = meeting.requestToJoin
    }

    rescheduleNotificationsForMeeting(meetingId)
}
