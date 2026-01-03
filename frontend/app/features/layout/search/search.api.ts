import { get } from "@api/api"
import type { Burrow } from "@features/burrows/burrows.types"
import { Profile } from "@features/profile/profile.model"

/**
 * A user search result.
 */
export type UserSearchResult = {
    type: "user"
    userID: string
    username: string
    profile: Profile
}

/**
 * A burrow search result.
 */
export type BurrowSearchResult = {
    type: "burrow"
    burrow: Burrow
    ownerUsername: string
    ownerProfile: Profile | null
}

/**
 * A search result - either a user or a burrow.
 */
export type SearchResult = UserSearchResult | BurrowSearchResult

/**
 * Type guard to check if a search result is a user.
 */
export function isUserResult(result: SearchResult): result is UserSearchResult {
    return result.type === "user"
}

/**
 * Type guard to check if a search result is a burrow.
 */
export function isBurrowResult(
    result: SearchResult
): result is BurrowSearchResult {
    return result.type === "burrow"
}

/**
 * Search for users and burrows.
 *
 * @param query The search query.
 * @param page The page of results (default 1).
 */
export async function search(
    query: string,
    page: number = 1
): Promise<PaginatedResponse<SearchResult>> {
    return get<PaginatedResponse<SearchResult>>("/search", {
        query: { query, page }
    })
}
