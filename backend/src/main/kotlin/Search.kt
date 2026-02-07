package app.burrow

import app.burrow.api.models.PaginatedResponse
import app.burrow.features.account.block.getAllBlockedRelationships
import app.burrow.features.account.models.Users
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.burrows.Burrow
import app.burrow.features.burrows.models.BurrowVisibility
import app.burrow.features.burrows.models.Burrows
import app.burrow.features.burrows.searchBurrows
import kotlin.collections.map
import kotlin.math.ceil
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.notInList
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.select

/** A search result that can be either a user or a burrow. */
@Serializable
sealed class SearchResult {
    /**
     * A user search result.
     *
     * @param userID The user's ID.
     * @param username The user's username from Users table.
     * @param profile The user's profile information.
     */
    @Serializable
    @SerialName("user")
    data class User(
        val userID: String,
        val username: String,
        val profile: app.burrow.features.account.profile.Profile,
    ) : SearchResult()

    /**
     * A burrow search result.
     *
     * @param burrow The burrow information.
     * @param ownerUsername The owner's username.
     * @param ownerProfile The owner's profile.
     */
    @Serializable
    @SerialName("burrow")
    data class BurrowResult(
        val burrow: app.burrow.features.burrows.Burrow,
        val ownerUsername: String,
        val ownerProfile: app.burrow.features.account.profile.Profile?,
    ) : SearchResult()
}

/** The number of results per page. */
private const val PAGE_SIZE = 20

/**
 * Search through users and Burrows using a query string.
 *
 * @param searchQuery The search query string.
 * @param page The page of results to return. Defaults to 1.
 * @param requestingUserID The ID of the user making the search request (for blocking filtering).
 * @return A [PaginatedResponse] of [SearchResult] containing matching users and Burrows.
 */
suspend fun search(
    searchQuery: String,
    page: Int = 1,
    requestingUserID: String? = null,
): PaginatedResponse<SearchResult> {
    if (searchQuery.isBlank()) {
        return PaginatedResponse(
            page = page,
            totalPages = 0,
            totalResults = 0,
            contents = emptyList(),
        )
    }

    val pattern = "%" + searchQuery.trim().lowercase().replace("%", "\\%").replace("_", "\\_") + "%"

    val userOffset = ((page - 1) * PAGE_SIZE).toLong()

    // get blocked users to exclude from results
    val blockedUserIds =
        if (requestingUserID != null)
            _root_ide_package_.app.burrow.features.account.block.getAllBlockedRelationships(
                requestingUserID
            )
        else emptySet()

    return query {
        // blocked users filter expression
        val blockedExpr: Op<Boolean> =
            if (blockedUserIds.isNotEmpty()) {
                Users.id notInList blockedUserIds.toList()
            } else {
                Op.TRUE
            }

        // count total users (excluding blocked)
        val userSearchExpr =
            ((Profiles.name.lowerCase() like pattern) or
                (Users.username.lowerCase() like pattern)) and blockedExpr

        val totalUsers =
            Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
                .select(Users.id)
                .where { userSearchExpr }
                .count()

        // count total burrows (excluding those hosted by blocked users)
        val tagsSearchExpr =
            object : Op<Boolean>() {
                override fun toQueryBuilder(queryBuilder: QueryBuilder) {
                    queryBuilder.append("lower(array_to_string(burrows.tags, ' ')) LIKE '$pattern'")
                }
            }

        val burrowBlockedExpr: Op<Boolean> =
            if (blockedUserIds.isNotEmpty()) {
                Burrows.ownerID notInList blockedUserIds.toList()
            } else {
                Op.TRUE
            }

        val burrowSearchExpr =
            (Burrows.visibility eq BurrowVisibility.PUBLIC) and
                burrowBlockedExpr and
                ((Burrows.title.lowerCase() like pattern) or
                    (Burrows.description.lowerCase() like pattern) or
                    (Burrows.location.lowerCase() like pattern) or
                    tagsSearchExpr)

        val totalBurrows = Burrows.select(Burrows.id).where { burrowSearchExpr }.count()

        val totalResults = totalUsers + totalBurrows
        val totalPages = ceil(totalResults.toDouble() / PAGE_SIZE).toInt()

        // search users
        val userResults: List<SearchResult> =
            Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
                .select(Users.columns + Profiles.columns)
                .where { userSearchExpr }
                .orderBy(Profiles.name, SortOrder.ASC)
                .offset(userOffset)
                .limit(PAGE_SIZE)
                .toList()
                .map { row ->
                    SearchResult.User(
                        userID = row[Users.id],
                        username = row[Users.username],
                        profile = Profile.fromRow(row),
                    )
                }

        // if already enough results, show
        if (userResults.size >= PAGE_SIZE) {
            return@query PaginatedResponse(
                page = page,
                totalPages = totalPages,
                totalResults = totalResults,
                contents = userResults,
            )
        }

        // calculate remaining amount, calculate according offset
        val remainingSlots = PAGE_SIZE - userResults.size
        val burrowOffset =
            if (userOffset > totalUsers) {
                userOffset - totalUsers
            } else {
                0L
            }

        val burrowResults: List<SearchResult> =
            searchBurrows {
                    limit = remainingSlots
                    offset = burrowOffset
                    query = searchQuery
                    this.requestingUserID = requestingUserID
                }
                .contents
                .map { (burrow, author, authorProfile) ->
                    SearchResult.BurrowResult(burrow, author ?: "Unknown", authorProfile)
                }

        PaginatedResponse(
            page = page,
            totalPages = totalPages,
            totalResults = totalResults,
            contents = userResults + burrowResults,
        )
    }
}
