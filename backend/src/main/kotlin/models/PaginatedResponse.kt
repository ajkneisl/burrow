package app.burrow.models

import kotlinx.serialization.Serializable

/**
 * A response that requires a page.
 *
 * @param page The page of results requested.
 * @param totalPages The amount of pages.
 * @param totalResults The total amount of results.
 * @param contents The contents of the page.
 */
@Serializable
data class PaginatedResponse<T>(
    val page: Int,
    val totalPages: Int,
    val totalResults: Long,
    val contents: List<T>,
)
