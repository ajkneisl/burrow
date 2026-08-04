import { get } from "../client"
import type { PaginatedResponse } from "../types"
import type { SearchResult } from "./search.models"

/**
 * Search for users, Burrows and clubs.
 *
 * @param query The search query.
 * @param page The page of results.
 */
export async function search(
    query: string,
    page: number = 1
): Promise<PaginatedResponse<SearchResult>> {
    return get("/search", { query: { query, page } })
}
