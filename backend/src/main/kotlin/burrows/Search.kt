package app.burrow.burrows

import app.burrow.account.Users
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.burrows.bookmarks.Bookmark
import app.burrow.burrows.bookmarks.Bookmarks
import app.burrow.burrows.membership.Membership
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowResponse
import app.burrow.burrows.models.BurrowKind
import app.burrow.burrows.models.BurrowVisibility
import app.burrow.burrows.models.Burrows
import app.burrow.models.PaginatedResponse
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
import org.jetbrains.exposed.v1.core.SortOrder
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
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * The amount of meetings per page.
 *
 * @see searchMeetings
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
            .associate { row -> row[Bookmarks.meetingID] to Bookmark.fromRow(row) }

    UserSearchContext(profile, memberships, bookmarks)
}

/**
 * Search through all Burrows.
 *
 * @param page The page of results.
 * @param kind The kind of Burrow.
 * @param search The search query. This will search through tags, title, description, location,
 *   etc..
 * @param dateRange The range of dates to search through.
 * @param forceAuthorName Force the author of the retrieved meetings to be a specific name.
 * @param requestingUserID The ID of the user searching. This allows for the implementation of
 *   bookmarks and memberships.
 * @return A list of [BurrowResponse]. The bookmark will be false and membership be null if there's
 *   no [requestingUserID].
 * @see BurrowKind
 */
suspend fun searchMeetings(
    page: Int = 1,
    kind: BurrowKind? = null,
    search: String? = null,
    dateRange: LongRange? = null,
    forceAuthorName: String? = null,
    requestingUserID: String? = null,
): PaginatedResponse<BurrowResponse> {
    // ensure the meeting is on the proper day
    val dateExpr: Op<Boolean> =
        if (dateRange == null) {
            // later than today
            (Burrows.endTime greaterEq getTimeMillis())
        } else {
            val zone = ZoneId.systemDefault()
            val startDate = Instant.ofEpochMilli(dateRange.first).atZone(zone).toLocalDate()
            val endDate = Instant.ofEpochMilli(dateRange.last).atZone(zone).toLocalDate()

            val startOfDayMillis = startDate.atStartOfDay(zone).toInstant().toEpochMilli()
            val endOfDayMillis = endDate.atTime(23, 59, 59).atZone(zone).toInstant().toEpochMilli()

            (Burrows.beginningTime greaterEq startOfDayMillis) and
                (Burrows.beginningTime lessEq endOfDayMillis)
        }

    // ensure something contains the proper term
    val searchExpr =
        if (!search?.trim().isNullOrBlank()) {
            val pattern =
                "%" + search.trim().lowercase().replace("%", "\\%").replace("_", "\\_") + "%"

            ((Burrows.title.lowerCase() like pattern) or
                (Burrows.description.lowerCase() like pattern) or
                (Burrows.location.lowerCase() like pattern) or
                (Burrows.tags.lowerCase() like pattern))
        } else Op.TRUE

    // ensure the kind of burrow
    val kindExpr = if (kind != null) (Burrows.kind eq kind) else Op.TRUE

    // ensure only public
    val privacyExpr = (Burrows.visibility eq BurrowVisibility.PUBLIC)

    val (meetingsCount, meetings) =
        query {
            val joinedAlias = Memberships.alias("m_joined")
            val waitingAlias = Memberships.alias("m_waiting")

            val joinedCountExpr = joinedAlias[Memberships.userID].countDistinct()
            val waitingCountExpr = waitingAlias[Memberships.userID].countDistinct()

            val meetingsCount =
                Burrows.select(Burrows.id).where { dateExpr and searchExpr and kindExpr }.count()

            val meetings =
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
                    .offset(PAGE_COUNT * (page - 1L))
                    .limit(PAGE_COUNT)
                    .where { dateExpr and searchExpr and kindExpr and privacyExpr }
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

    val responses =
        if (requestingUserID.isNullOrBlank())
            meetings.map { (meeting, row) ->
                BurrowResponse(
                    burrow = meeting,
                    burrowAuthor = forceAuthorName ?: row[Users.username],
                    burrowAuthorProfile = Profile.fromRow(row),
                    membership = null,
                    bookmarked = false,
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
                    burrowAuthorProfile = Profile.fromRow(row),
                    membership = context.memberships[meeting.id],
                    bookmarked = context.bookmarks.containsKey(meeting.id),
                    highlightedTags = highlightedTags,
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
