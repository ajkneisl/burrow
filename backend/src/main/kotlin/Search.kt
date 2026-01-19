package app.burrow

import app.burrow.account.models.Users
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.burrows.Burrow
import app.burrow.burrows.models.BurrowVisibility
import app.burrow.burrows.models.Burrows
import app.burrow.burrows.searchBurrows
import app.burrow.models.PaginatedResponse
import kotlin.math.ceil
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
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
    data class User(val userID: String, val username: String, val profile: Profile) : SearchResult()

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
        val burrow: Burrow,
        val ownerUsername: String,
        val ownerProfile: Profile?,
    ) : SearchResult()
}

/** The number of results per page. */
private const val PAGE_SIZE = 20

/**
 * Search through users and burrows using a query string.
 *
 * @param searchQuery The search query string.
 * @param page The page of results to return. Defaults to 1.
 * @return A [PaginatedResponse] of [SearchResult] containing matching users and burrows.
 */
suspend fun search(searchQuery: String, page: Int = 1): PaginatedResponse<SearchResult> {
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

    return query {
        // count total uesrs
        val userSearchExpr =
            (Profiles.name.lowerCase() like pattern) or (Users.username.lowerCase() like pattern)

        val totalUsers =
            Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
                .select(Users.id)
                .where { userSearchExpr }
                .count()

        // count total burrows
        val tagsSearchExpr = object : Op<Boolean>() {
            override fun toQueryBuilder(queryBuilder: QueryBuilder) {
                queryBuilder.append(
                    "lower(array_to_string(burrows.tags, ' ')) LIKE '$pattern'"
                )
            }
        }

        val burrowSearchExpr =
            (Burrows.visibility eq BurrowVisibility.PUBLIC) and
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
