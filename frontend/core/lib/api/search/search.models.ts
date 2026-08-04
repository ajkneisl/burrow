import type { Burrow } from "../burrows/burrows.models"
import type { Profile } from "../user/user.models"

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
 * A club search result.
 */
export type ClubSearchResult = {
    type: "club"
    clubID: string
    displayName: string
    name: string
}

/**
 * A search result — either a user, burrow, or club.
 */
export type SearchResult =
    | UserSearchResult
    | BurrowSearchResult
    | ClubSearchResult

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
 * Type guard to check if a search result is a club.
 */
export function isClubResult(result: SearchResult): result is ClubSearchResult {
    return result.type === "club"
}
