package app.burrow.features.clubs

import app.burrow.api.models.PaginatedResponse
import app.burrow.features.clubs.models.enums.ClubCategory
import app.burrow.features.clubs.models.enums.ClubPrivacy
import app.burrow.features.clubs.models.Club
import app.burrow.query
import app.burrow.toEntity
import kotlin.math.ceil
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.r2dbc.selectAll

private const val CLUBS_PAGE_SIZE = 20

/**
 * Search for clubs with optional filtering.
 *
 * @param page The page number.
 * @param category Optional category filter.
 * @param searchQuery Optional search query to match against display name.
 */
suspend fun searchClubs(
    page: Int = 1,
    category: ClubCategory? = null,
    searchQuery: String? = null,
): PaginatedResponse<Club> = query {
    var condition: Op<Boolean> = Clubs.privacy eq ClubPrivacy.PUBLIC

    if (category != null) {
        condition = condition and (Clubs.category eq category)
    }

    if (!searchQuery.isNullOrBlank()) {
        val pattern = "%${searchQuery.trim().lowercase()}%"
        condition = condition and (Clubs.displayName.lowerCase() like pattern)
    }

    val baseQuery = Clubs.selectAll().where { condition }

    val itemCount = baseQuery.count()

    val clubs =
        baseQuery
            .orderBy(Clubs.createdAt, SortOrder.DESC)
            .limit(CLUBS_PAGE_SIZE)
            .offset(CLUBS_PAGE_SIZE * (page - 1L))
            .toList()
            .map { row -> row.toEntity<Club>(Clubs) }

    PaginatedResponse(page, ceil(itemCount / CLUBS_PAGE_SIZE.toDouble()).toInt(), itemCount, clubs)
}
