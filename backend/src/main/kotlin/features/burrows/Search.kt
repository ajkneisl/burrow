package app.burrow.features.burrows

import app.burrow.features.account.block.getAllBlockedRelationships
import app.burrow.features.account.models.Users
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.account.ta.getTAUserIDs
import app.burrow.features.burrows.bookmarks.Bookmark
import app.burrow.features.burrows.bookmarks.Bookmarks
import app.burrow.features.burrows.membership.Membership
import app.burrow.features.burrows.membership.Memberships
import app.burrow.features.burrows.models.BurrowKind
import app.burrow.features.burrows.models.BurrowMemberStatus
import app.burrow.features.burrows.models.BurrowResponse
import app.burrow.features.burrows.models.BurrowVisibility
import app.burrow.features.burrows.models.Burrows
import app.burrow.doIf
import app.burrow.api.models.PaginatedResponse
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.time.Instant
import java.time.ZoneId
import kotlin.collections.plus
import kotlin.math.ceil
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.TextColumnType
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.countDistinct
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.notInList
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * The amount of meetings per page.
 *
 * @see searchBurrows
 */
private const val PAGE_COUNT = 50

/**
 * User context data for search results.
 *
 * @param profile The user's profile information.
 * @param memberships Map of meeting IDs to the user's membership status.
 * @param bookmarks Map of meeting IDs to the user's bookmarks.
 */
private data class UserSearchContext(
    val profile: Profile?,
    val memberships: Map<String, Membership>,
    val bookmarks: Map<String, Bookmark>,
)

/**
 * Fetch user profile, memberships, and bookmarks in a single database transaction.
 *
 * @param userID The ID of the user to fetch data for.
 * @return A [UserSearchContext] containing all user data needed for search results.
 */
private suspend fun getUserSearchContext(userID: String): UserSearchContext = query {
    val profile =
        Profiles.selectAll()
            .where { Profiles.userID eq userID }
            .map { Profile.fromRow(it) }
            .singleOrNull()

    val memberships =
        Memberships.selectAll()
            .where { Memberships.userID eq userID }
            .toList()
            .associate { row -> row[Memberships.burrowID] to Membership.fromRow(row) }

    val bookmarks =
        Bookmarks.selectAll()
            .where { Bookmarks.userID eq userID }
            .toList()
            .associate { row -> row[Bookmarks.burrowID] to Bookmark.fromRow(row) }

    UserSearchContext(profile, memberships, bookmarks)
}

/** Context to search a Burrow */
data class SearchBurrowsBuilder(
    /** The kind of Burrow to search for. */
    var kind: BurrowKind? = null,

    /**
     * A query to search through [Burrow.title], [Burrow.tags], [Burrow.location] and
     * [Burrow.description].
     */
    var query: String? = null,

    /** The date range that [Burrow.endTime] is within. */
    var dateRange: LongRange? = null,

    /** The ID of the user requesting this search. */
    var requestingUserID: String? = null,

    /** Search by [Burrow.ownerID]. */
    var authorUserID: String? = null,

    /** Search by [requestingUserID]'s bookmarked Burrows. */
    var isBookmarked: Boolean? = null,

    /** Filter by if the ID provided is hosting the Burrow. */
    var isHostedBy: String? = null,

    /** Filter by if the ID provided is NOT hosting the Burrow. */
    var isNotHostedBy: String? = null,

    /** Filter by if the ID provided is in the Burrow. */
    var isJoinedBy: String? = null,

    /** Filter by TA hosted. */
    var isTa: Boolean? = null,

    /** Force all the Burrows responded to have a specific name. */
    var forceAuthorName: String? = null,

    /** Override the provided page and set how the request offset. */
    var offset: Long? = null,

    /** Override the provided page and set a limit of how many Burrows. */
    var limit: Int? = null,

    /** Ignore TA and prevent the request. */
    var preventTa: Boolean = false,
)

/**
 * Search through all Burrows.
 *
 * @param page The page of results.
 * @return A list of [BurrowResponse].
 * @see SearchBurrowsBuilder
 * @see BurrowKind
 */
suspend fun searchBurrows(
    page: Int = 1,
    searchContext: SearchBurrowsBuilder.() -> Unit,
): PaginatedResponse<BurrowResponse> {
    val context = SearchBurrowsBuilder()

    searchContext(context)

    val (
        kind,
        query,
        dateRange,
        requestingUserID,
        authorUserID,
        isBookmarked,
        isHostedBy,
        isNotHostedBy,
        isJoinedBy,
        isTa,
        forceAuthorName,
        offset,
        limit,
        preventTa) =
        context

    // ensure the meeting is on the proper day
    val dateExpr: Op<Boolean> =
        if (dateRange == null) {
            // later than today
            (Burrows.endTime greaterEq getTimeMillis())
        } else {
            val zone = ZoneId.systemDefault()

            val startOfDayExpr =
                if (dateRange.first != -1L) {
                    val startDate = Instant.ofEpochMilli(dateRange.first).atZone(zone).toLocalDate()
                    val startOfDayMillis = startDate.atStartOfDay(zone).toInstant().toEpochMilli()

                    (Burrows.beginningTime greaterEq startOfDayMillis)
                } else Op.TRUE

            val endOfDayExpr =
                if (dateRange.last != -1L) {
                    val endDate = Instant.ofEpochMilli(dateRange.last).atZone(zone).toLocalDate()
                    val endOfDayMillis =
                        endDate.atTime(23, 59, 59).atZone(zone).toInstant().toEpochMilli()

                    (Burrows.beginningTime lessEq endOfDayMillis)
                } else Op.TRUE

            startOfDayExpr and endOfDayExpr
        }

    // ensure something contains the proper term
    val searchExpr =
        if (!query?.trim().isNullOrBlank()) {
            val cleanQuery = query.trim().lowercase().replace("%", "\\%").replace("_", "\\_")
            val pattern = "%$cleanQuery%"

            // Custom expression to search in tags array using parameterized query
            val tagsSearchExpr =
                object : Op<Boolean>() {
                    override fun toQueryBuilder(queryBuilder: QueryBuilder) {
                        queryBuilder.append("lower(array_to_string(burrows.tags, ' ')) LIKE ")
                        queryBuilder.registerArgument(TextColumnType(), pattern)
                    }
                }

            ((Burrows.title.lowerCase() like pattern) or
                (Burrows.description.lowerCase() like pattern) or
                (Burrows.location.lowerCase() like pattern) or
                tagsSearchExpr)
        } else Op.TRUE

    // ensure the kind of burrow
    val kindExpr = if (kind != null) (Burrows.kind eq kind) else Op.TRUE

    // ensure only public
    val privacyExpr = (Burrows.visibility eq BurrowVisibility.PUBLIC)

    // ensure correct author
    val authorExpr = if (authorUserID != null) (Burrows.ownerID eq authorUserID) else Op.TRUE

    // get only hosted burrows
    val hostExpr =
        when {
            isHostedBy != null -> (Burrows.ownerID eq isHostedBy)
            isNotHostedBy != null -> (Burrows.ownerID neq isNotHostedBy)
            else -> Op.TRUE
        }

    // filter to burrows hosted by TAs where their classes overlap with the tags
    val taExpr: Op<Boolean> =
        if (isTa == true && !preventTa) {
            // Check if the burrow owner is a TA AND their classes array overlaps with tags array
            // Uses PostgreSQL && operator for array overlap
            object : Op<Boolean>() {
                override fun toQueryBuilder(queryBuilder: QueryBuilder) {
                    queryBuilder.append(
                        """
                        EXISTS (
                            SELECT 1 FROM account_ta ta
                            WHERE ta.user_id = burrows.owner_id
                            AND ta.classes && burrows.tags
                        )
                        """
                            .trimIndent()
                    )
                }
            }
        } else {
            Op.TRUE
        }

    // exclude burrows from users with whom the requesting user has a block relationship (either direction)
    val blockedUserIds =
        if (requestingUserID != null) getAllBlockedRelationships(requestingUserID) else emptySet()

    val blockedExpr: Op<Boolean> =
        if (blockedUserIds.isNotEmpty()) {
            Burrows.ownerID notInList blockedUserIds.toList()
        } else {
            Op.TRUE
        }

    // combination of all search requests
    val whereExpr =
        dateExpr and searchExpr and kindExpr and privacyExpr and authorExpr and hostExpr and taExpr and blockedExpr

    val (meetingsCount, meetings) =
        query {
            val joinedAlias = Memberships.alias("m_joined")
            val waitingAlias = Memberships.alias("m_waiting")

            val joinedCountExpr = joinedAlias[Memberships.userID].countDistinct()
            val waitingCountExpr = waitingAlias[Memberships.userID].countDistinct()

            // count all meetings with the condition
            val meetingsCount =
                // if bookmarked. account for bookmarks
                if (isBookmarked == true && requestingUserID != null) {
                        Burrows.innerJoin(
                            Bookmarks,
                            { Burrows.id },
                            { Bookmarks.burrowID },
                            additionalConstraint = { Bookmarks.userID eq requestingUserID },
                        )
                    } else {
                        Burrows
                    }
                    .select(Burrows.id)
                    .where { whereExpr }
                    .count()

            val meetings =
                Burrows.innerJoin(Users, { Burrows.ownerID }, { Users.id })
                    // find the amount of joined users
                    .leftJoin(
                        otherTable = joinedAlias,
                        onColumn = { Burrows.id },
                        otherColumn = { joinedAlias[Memberships.burrowID] },
                        additionalConstraint = {
                            joinedAlias[Memberships.status] eq BurrowMemberStatus.JOINED
                        },
                    )
                    // find the amount of users in the waitlist
                    .leftJoin(
                        otherTable = waitingAlias,
                        onColumn = { Burrows.id },
                        otherColumn = { waitingAlias[Memberships.burrowID] },
                        additionalConstraint = {
                            waitingAlias[Memberships.status] eq BurrowMemberStatus.WAITLISTED
                        },
                    )
                    // join profiles on
                    .leftJoin(Profiles, { Burrows.ownerID }, { Profiles.userID })
                    // if searching by bookmarked
                    .doIf(isBookmarked == true && requestingUserID != null) {
                        // join bookmarks depending on requestingUserID
                        innerJoin(
                            otherTable = Bookmarks,
                            onColumn = { Burrows.id },
                            otherColumn = { Bookmarks.burrowID },
                            additionalConstraint = { Bookmarks.userID eq requestingUserID!! },
                        )
                    }
                    // if searching by joined
                    .doIf(isJoinedBy != null) {
                        // join memberships depending on requestingUserID
                        innerJoin(
                            otherTable = Memberships,
                            onColumn = { Burrows.id },
                            otherColumn = { Memberships.burrowID },
                            additionalConstraint = { Memberships.userID eq isJoinedBy!! },
                        )
                    }
                    // select for search result
                    .select(
                        Burrows.columns +
                            Profiles.columns +
                            listOf(Users.username, Users.id, joinedCountExpr, waitingCountExpr)
                    )
                    // offset depending on builder or page count for fallback
                    .offset(offset ?: (PAGE_COUNT * (page - 1L)))
                    .limit(limit ?: PAGE_COUNT)
                    .where { whereExpr }
                    .groupBy(
                        *Burrows.columns.toTypedArray(),
                        *Profiles.columns.toTypedArray(),
                        Users.username,
                        Users.id,
                    )
                    .orderBy(Burrows.beginningTime, SortOrder.ASC)
                    .toList()
                    .associateBy { row ->
                        val joinedCount = row[joinedCountExpr]
                        val waitingCount = row[waitingCountExpr]

                        Burrow.fromRow(row, joinedCount, waitingCount)
                    }

            meetingsCount to meetings
        }

    // Get all unique owner IDs and fetch their TA status with classes
    val ownerIds = meetings.keys.map { it.ownerID }.distinct()
    val taOwnerClasses = getTAUserIDs(ownerIds).toMap()

    fun isHostedByTA(ownerID: String, tags: Set<String>): Boolean {
        val taClasses = taOwnerClasses[ownerID] ?: return false
        val normalizedTags = tags.map { it.replace(Regex("[\\s_-]"), "").lowercase() }.toSet()

        return taClasses.any { taClass ->
            val normalizedClass = taClass.replace(Regex("[\\s_-]"), "").lowercase()

            normalizedTags.contains(normalizedClass)
        }
    }

    val responses =
        if (requestingUserID.isNullOrBlank())
            meetings.map { (meeting, row) ->
                BurrowResponse(
                    burrow = meeting,
                    burrowAuthor = forceAuthorName ?: row[Users.username],
                    burrowAuthorProfile =
                        if (forceAuthorName != null) null else Profile.fromRow(row),
                    membership = null,
                    bookmarked = false,
                    hostedByTa = isHostedByTA(meeting.ownerID, meeting.tags),
                )
            }
        else {
            val context = getUserSearchContext(requestingUserID)

            meetings.map { (meeting, row) ->
                val highlightedTags = buildList {
                    meeting.tags.forEachIndexed { index, tag ->
                        val normalizedTag = tag.replace(Regex("[\\s_-]"), "").lowercase()

                        context.profile
                            ?.classes
                            ?.map { className ->
                                className.replace(Regex("[\\s_-]"), "").lowercase()
                            }
                            ?.filter { className -> className == normalizedTag }
                            ?.forEach { _ -> add(index) }
                    }
                }

                BurrowResponse(
                    burrow = meeting,
                    burrowAuthor = forceAuthorName ?: row[Users.username],
                    burrowAuthorProfile =
                        if (forceAuthorName != null) null else Profile.fromRow(row),
                    membership = context.memberships[meeting.id],
                    bookmarked = context.bookmarks.containsKey(meeting.id),
                    highlightedTags = highlightedTags,
                    hostedByTa = isHostedByTA(meeting.ownerID, meeting.tags),
                )
            }
        }

    return PaginatedResponse(
        page = page,
        totalPages = ceil(meetingsCount.toDouble() / PAGE_COUNT).toInt(),
        totalResults = meetingsCount,
        contents = responses,
    )
}
