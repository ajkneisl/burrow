/**
 * A response from the API that's paginated.
 *
 * @param page The page of the content requested.
 * @param totalPages The total amount of pages.
 * @param totalResults The total amount of results.
 * @param contents The contents on the requested page.
 */
export type PaginatedResponse<T> = {
    page: number
    totalPages: number
    totalResults: number
    contents: T[]
}
