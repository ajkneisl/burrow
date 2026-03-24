package app.burrow.features.burrows.models

import app.burrow.api.MappedTable
import app.burrow.api.InvalidAuthorization
import app.burrow.api.NotFound
import app.burrow.features.account.Users
import app.burrow.features.account.getAllBlockedRelationships
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.account.ta.getUserTAStatus
import app.burrow.features.burrows.Burrows
import app.burrow.features.burrows.bookmarks.Bookmarks
import app.burrow.features.burrows.membership.Membership
import app.burrow.features.burrows.membership.Memberships
import app.burrow.features.burrows.membership.isMemberOf
import app.burrow.features.burrows.models.enums.BurrowMemberStatus
import app.burrow.features.burrows.models.enums.BurrowRole
import app.burrow.features.burrows.models.enums.BurrowVisibility
import app.burrow.features.burrows.models.enums.BurrowKind
import app.burrow.features.burrows.sync.block.BlockState
import app.burrow.features.burrows.sync.block.BlockStates
import app.burrow.features.clubs.models.Club
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.members.getClubMembership
import app.burrow.features.invites.InviteType
import app.burrow.features.invites.createInvite
import app.burrow.features.notifications.rescheduleNotificationsForBurrow
import app.burrow.features.requests.JoinRequestStatus
import app.burrow.features.requests.getJoinRequest
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlin.time.Duration.Companion.days
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.countDistinct
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** A Burrow. */
@Serializable
@MappedTable(Burrows::class)
data class Burrow(
    /** Unique ID of the meeting. */
    val id: String,

    /** The ID of the user who owns/created the meeting. */
    val ownerID: String,

    /** The ID of the club that owns this burrow, or null if user-owned. */
    val clubID: String? = null,

    /** The title of the Burrow. */
    val title: String,

    /** The description of the Burrow. */
    val description: String,

    /** The location of the Burrow. */
    val location: String,

    /** The kind of Burrow. */
    val kind: BurrowKind,

    /** The starting time of the Burrow. */
    val beginningTime: Long,

    /** The end time of the Burrow. */
    val endTime: Long,

    /** The tags. */
    val tags: Collection<String>,

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

    /**
     * If the Burrow is reoccurring. This corresponds to [app.burrow.features.burrows.DAILY], [app.burrow.features.burrows.WEEKLY], or [app.burrow.features.burrows.MONTHLY]. This will
     * be -1 if not reoccurring.
     */
    val reoccurring: Int,
)

/**
 * Create a Project Burrow
 *
 * @param userID The ID of the owner.
 * @param project The submitted project details.
 */
suspend fun createProjectBurrow(userID: String, project: SubmittedProjectBurrow): Burrow {
    val projectBurrow =
        Burrow(
            id = UUID.randomUUID().toString().replace("-", "").take(8),
            ownerID = userID,
            title = project.name,
            description = project.objective,
            location = project.className,
            kind = project.kind,
            beginningTime = 0, // projects don't have specific meeting times
            endTime = project.dueDate,
            tags = emptySet(), // no
            creationDate = getTimeMillis(),
            capacity = 10, // capacity limit is always 10
            visibility = BurrowVisibility.UNLISTED,
            requestToJoin = true,
            reoccurring = -1,
        )

    query {
        // insert burrow
        Burrows.insert {
            it[Burrows.id] = projectBurrow.id
            it[ownerID] = projectBurrow.ownerID
            it[title] = projectBurrow.title
            it[description] = projectBurrow.description
            it[location] = projectBurrow.location
            it[kind] = projectBurrow.kind
            it[beginningTime] = projectBurrow.beginningTime
            it[endTime] = projectBurrow.endTime
            it[tags] = projectBurrow.tags.toList()
            it[creationDate] = projectBurrow.creationDate
            it[capacity] = projectBurrow.capacity
            it[visibility] = projectBurrow.visibility
            it[requestToJoin] = projectBurrow.requestToJoin
            it[reoccurring] = projectBurrow.reoccurring
        }

        // insert membership for host
        Memberships.insert {
            it[Memberships.burrowID] = projectBurrow.id
            it[Memberships.userID] = projectBurrow.ownerID
            it[Memberships.role] = BurrowRole.HOST
            it[Memberships.status] = BurrowMemberStatus.JOINED
            it[Memberships.joinedAt] = projectBurrow.creationDate
        }

        // by default, enable CHAT
        BlockStates.insert {
            it[BlockStates.burrowID] = projectBurrow.id
            it[BlockStates.blockID] = "CHAT"
            it[BlockStates.data] = BlockState.EMPTY
        }
    }

    // schedule notifications for due date
    rescheduleNotificationsForBurrow(projectBurrow.id)

    // invite all members
    project.teamMembers.forEach { memberID ->
        createInvite(
            userID,
            memberID,
            projectBurrow.id,
            InviteType.BURROW,
            getTimeMillis() + 7.days.inWholeMilliseconds,
        )
    }

    return projectBurrow
}

/**
 * Create a Burrow
 *
 * @param userID The ID of the owner.
 * @param submittedBurrow The submitted details.
 * @param clubID If provided, the burrow is owned by this club. The user must be an admin of the
 *   club.
 */
suspend fun createBurrow(
    userID: String,
    submittedBurrow: SubmittedStudyEventBurrow,
    clubID: String? = null,
): Burrow {
    // If club-owned, validate the user is an admin of the club
    if (clubID != null) {
        val membership = getClubMembership(userID, clubID)
        if (membership == null || membership.role != ClubRole.ADMINISTRATOR) {
            throw InvalidAuthorization()
        }
    }

    val createdBurrow =
        Burrow(
            id = UUID.randomUUID().toString().replace("-", "").take(8),
            ownerID = userID,
            clubID = clubID,
            title = submittedBurrow.title,
            description = submittedBurrow.description,
            location = submittedBurrow.location,
            kind = submittedBurrow.kind,
            beginningTime = submittedBurrow.beginningTime,
            endTime = submittedBurrow.endTime,
            tags = submittedBurrow.tags,
            creationDate = getTimeMillis(),
            capacity = submittedBurrow.capacity,
            visibility = submittedBurrow.visibility,
            requestToJoin = submittedBurrow.requestToJoin,
            reoccurring = submittedBurrow.reoccurring,
        )

    query {
        // insert burrow
        Burrows.insert {
            it[Burrows.id] = createdBurrow.id
            it[ownerID] = createdBurrow.ownerID
            it[Burrows.clubID] = createdBurrow.clubID
            it[title] = createdBurrow.title
            it[description] = createdBurrow.description
            it[location] = createdBurrow.location
            it[kind] = createdBurrow.kind
            it[beginningTime] = createdBurrow.beginningTime
            it[endTime] = createdBurrow.endTime
            it[tags] = createdBurrow.tags.toList()
            it[creationDate] = createdBurrow.creationDate
            it[capacity] = createdBurrow.capacity
            it[visibility] = createdBurrow.visibility
            it[requestToJoin] = createdBurrow.requestToJoin
            it[reoccurring] = createdBurrow.reoccurring
        }

        // insert membership for the creating user as host
        Memberships.insert {
            it[Memberships.burrowID] = createdBurrow.id
            it[Memberships.userID] = userID
            it[Memberships.role] = BurrowRole.HOST
            it[Memberships.status] = BurrowMemberStatus.JOINED
            it[Memberships.joinedAt] = createdBurrow.creationDate
        }

        // by default, enable CHAT
        BlockStates.insert {
            it[BlockStates.burrowID] = createdBurrow.id
            it[BlockStates.blockID] = "CHAT"
            it[BlockStates.data] = BlockState.EMPTY
        }
    }

    // schedule notifications
    rescheduleNotificationsForBurrow(createdBurrow.id)

    return createdBurrow
}

/**
 * Get a meeting by its [burrowID].
 *
 * @param burrowID The ID of the meeting.
 */
suspend fun getBurrow(burrowID: String): Burrow? = query {
    Burrows.selectAll().where { Burrows.id eq burrowID }.firstOrNull()?.toEntity(Burrows)
}

/**
 * Get a [BurrowResponse] by its ID.
 *
 * @param burrowID The ID of the Burrow.
 * @param requestingUserID The ID of the user requesting, to combine the membership information.
 * @return A [BurrowResponse] with all meeting and user-specific data, or null if meeting not found.
 */
suspend fun getBurrowResponse(burrowID: String, requestingUserID: String?): BurrowResponse? {
    data class MeetingData(
        val burrow: Burrow,
        val authorUsername: String?,
        val authorProfile: Profile?,
        val club: Club?,
        val joined: Long,
        val waiting: Long,
    )

    val meetingData =
        query {
            val joinedAlias = Memberships.alias("m_joined")
            val waitingAlias = Memberships.alias("m_waiting")

            val joinedCountExpr = joinedAlias[Memberships.userID].countDistinct()
            val waitingCountExpr = waitingAlias[Memberships.userID].countDistinct()

            Burrows.leftJoin(Users, { Burrows.ownerID }, { Users.id })
                .leftJoin(Clubs, { Burrows.clubID }, { Clubs.id })
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
                        Clubs.columns +
                        listOf(Users.username, Users.id, joinedCountExpr, waitingCountExpr)
                )
                .where { Burrows.id eq burrowID }
                .groupBy(
                    *Burrows.columns.toTypedArray(),
                    *Profiles.columns.toTypedArray(),
                    *Clubs.columns.toTypedArray(),
                    Users.username,
                    Users.id,
                )
                .singleOrNull()
                ?.let { row ->
                    val joinedCount = row[joinedCountExpr]
                    val waitingCount = row[waitingCountExpr]
                    val burrow = row.toEntity<Burrow>(Burrows)

                    // Determine if this is a user-owned or club-owned burrow
                    val club = row.getOrNull(Clubs.id)?.let { row.toEntity<Club>(Clubs) }
                    val authorUsername = row.getOrNull(Users.username)
                    val authorProfile =
                        if (authorUsername != null) row.toEntity<Profile>(Profiles) else null

                    MeetingData(
                        burrow,
                        authorUsername,
                        authorProfile,
                        club,
                        joinedCount,
                        waitingCount,
                    )
                }
        } ?: return null

    val (burrow, authorUsername, authorProfile, club, joined, waiting) = meetingData

    // check if the requesting user has a block relationship with the burrow owner
    // (skip for club-owned burrows)
    if (requestingUserID != null && club == null) {
        val blockedUsers = getAllBlockedRelationships(requestingUserID)
        if (burrow.ownerID in blockedUsers) {
            throw NotFound()
        }
    }

    // if the meeting is private do some checks
    if (burrow.visibility == BurrowVisibility.PRIVATE) {
        val isMember = requestingUserID?.isMemberOf(burrow.id) ?: false

        if (!isMember) throw NotFound()
    }

    // Check if the burrow owner is a TA for one of the classes in the tags
    // (only applicable for user-owned burrows)
    val hostedByTa =
        if (club == null) {
            getUserTAStatus(burrow.ownerID)?.let { taStatus ->
                val normalizedTags =
                    burrow.tags.map { it.replace(Regex("[\\s_-]"), "").lowercase() }.toSet()
                taStatus.classes.any { taClass ->
                    val normalizedClass = taClass.replace(Regex("[\\s_-]"), "").lowercase()
                    normalizedTags.contains(normalizedClass)
                }
            } ?: false
        } else false

    val displayAuthor = club?.displayName ?: authorUsername ?: "Fellow Burrower"
    val displayProfile = if (club != null) null else authorProfile

    // return response without user-specific data if no userID provided
    if (requestingUserID.isNullOrBlank()) {
        return BurrowResponse(
            burrow = burrow,
            burrowAuthor = displayAuthor,
            burrowAuthorProfile = displayProfile,
            membership = null,
            bookmarked = false,
            hostedByTa = hostedByTa,
            joined = joined,
            waiting = waiting,
            clubName = club?.name,
            clubDisplayName = club?.displayName,
        )
    }

    val (profile, membership, bookmarked) =
        query {
            val profile =
                Profiles.selectAll()
                    .where { Profiles.userID eq requestingUserID }
                    .map { row -> row.toEntity<Profile>(Profiles) }
                    .singleOrNull()

            val membership =
                Memberships.selectAll()
                    .where {
                        (Memberships.userID eq requestingUserID) and
                            (Memberships.burrowID eq burrowID)
                    }
                    .map { row -> row.toEntity<Membership>(Memberships) }
                    .singleOrNull()

            val bookmarked =
                Bookmarks.selectAll()
                    .where {
                        (Bookmarks.userID eq requestingUserID) and (Bookmarks.burrowID eq burrowID)
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
        burrowAuthor = displayAuthor,
        burrowAuthorProfile = displayProfile,
        membership = membership,
        requestedToJoin = requestedToJoin,
        bookmarked = bookmarked,
        highlightedTags = highlightedTags,
        hostedByTa = hostedByTa,
        joined = joined,
        waiting = waiting,
        clubName = club?.name,
        clubDisplayName = club?.displayName,
    )
}

/**
 * Delete a meeting by its ID.
 *
 * @param id The ID of the meeting to delete.
 */
suspend fun deleteMeeting(id: String) = query { Burrows.deleteWhere { Burrows.id eq id } }

/**
 * Update a project burrow by its [projectId].
 *
 * @param projectId The ID of the project to update.
 * @param project The updated contents of the project.
 */
suspend fun updateProjectBurrow(projectId: String, project: SubmittedProjectBurrow) {
    query {
        Burrows.update({ Burrows.id eq projectId }) {
            it[Burrows.title] = project.name
            it[Burrows.description] = project.objective
            it[Burrows.location] = project.className
            it[Burrows.endTime] = project.dueDate
        }
    }

    // Update team members - remove old members not in new list
    val currentMembers = query {
        Memberships.selectAll()
            .where {
                (Memberships.burrowID eq projectId) and (Memberships.role eq BurrowRole.MEMBER)
            }
            .map { it[Memberships.userID] }
            .toList()
            .toSet()
    }

    val newMembers = project.teamMembers.toSet()

    // Remove members not in new list
    val membersToRemove = currentMembers.filterNot { it in newMembers }
    if (membersToRemove.isNotEmpty()) {
        query {
            membersToRemove.forEach { memberID ->
                Memberships.deleteWhere {
                    (Memberships.burrowID eq projectId) and (Memberships.userID eq memberID)
                }
            }
        }
    }

    // Add new members
    val membersToAdd = newMembers.filterNot { it in currentMembers }
    if (membersToAdd.isNotEmpty()) {
        query {
            membersToAdd.forEach { memberID ->
                Memberships.insert {
                    it[Memberships.burrowID] = projectId
                    it[Memberships.userID] = memberID
                    it[Memberships.role] = BurrowRole.MEMBER
                    it[Memberships.status] = BurrowMemberStatus.JOINED
                    it[Memberships.joinedAt] = getTimeMillis()
                }
            }
        }
    }

    rescheduleNotificationsForBurrow(projectId)
}

/**
 * Update a meeting by its [burrowID].
 *
 * @param burrowID The ID of the meeting to update.
 * @param meeting The updated contents of the meeting.
 */
suspend fun updatedBurrow(burrowID: String, meeting: SubmittedStudyEventBurrow) = query {
    Burrows.update({ Burrows.id eq burrowID }) {
        it[Burrows.title] = meeting.title
        it[Burrows.description] = meeting.description
        it[Burrows.location] = meeting.location
        it[Burrows.beginningTime] = meeting.beginningTime
        it[Burrows.endTime] = meeting.endTime
        it[Burrows.tags] = meeting.tags.toList()
        it[Burrows.capacity] = meeting.capacity
        it[Burrows.visibility] = meeting.visibility
        it[Burrows.requestToJoin] = meeting.requestToJoin
        it[Burrows.reoccurring] = meeting.reoccurring
    }

    rescheduleNotificationsForBurrow(burrowID)
}
