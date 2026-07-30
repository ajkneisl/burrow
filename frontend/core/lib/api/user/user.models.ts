import type { BurrowResponse } from "../burrows/burrows.models"

/**
 * The type of a user's account.
 */
export type AccountType = "USER" | "ADMIN"

/**
 * A Burrow user.
 *
 * @param id The ID provided by Google.
 * @param username The user-selected (initially derived from their email) name.
 * @param accountType The type of account, granting access to the admin panel.
 * @param createdAt When the user created their account.
 */
export type User = {
    id: string
    username: string
    accountType: AccountType
    createdAt: number
}

/**
 * The authorized user.
 *
 * @param user The user object.
 * @param newUser If the user's account is new.
 * @param token An authorization token.
 * @param refreshToken A token used to rotate {@link AuthorizedUser.token}.
 */
export type AuthorizedUser = {
    user: User
    newUser: boolean
    token: string
    refreshToken: string
}

/**
 * A user's profile.
 */
export type Profile = {
    userID: string
    name: string
    visibility: ProfileVisibility
    gradYear: number | null
    classes: string[] | null
    school: string | null
    major: string | null
    bio: string | null
    instagram: string | null
    linkedIn: string | null
    phoneNumber: string | null
    badges: Badge[]
}

/**
 * Who a profile is visible to.
 */
export type ProfileVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE"

/**
 * A badge that can be assigned to users.
 */
export type Badge = {
    id: string
    description: string
}

/**
 * A user's following information.
 */
export type Following = {
    following: number
    followers: number
    mutuals: number
    theyFollow: boolean
    youFollow: boolean
}

/**
 * A response from retrieving a user.
 */
export type UserResponse = {
    user: User
    profile: Profile
    following: Following
    recentJoinedBurrows: BurrowResponse[]
    recentHostedBurrows: BurrowResponse[]
    badges?: Badge[]
    email?: string
    isTa?: boolean
    isBlocked?: boolean
}

/**
 * This resembles a relation between two users, primarily in the form of a
 * Follower or Friend.
 *
 * @param userID The ID of the friend.
 * @param username The username of the friend.
 * @param name The name of the friend.
 * @param friendsAt When you became friends. This is undefined if they're not
 *   friends, or that wasn't the relation that was retrieved.
 * @param theyFollowedAt When the retriever followed the user.
 * @param youFollowedAt When you followed the user.
 */
export type Relation = {
    userID: string
    username: string
    name: string
    friendsAt?: number
    theyFollowedAt?: number
    youFollowedAt?: number
}

/**
 * Reasoning for why a user was discovered.
 */
export type DiscoverReasoning =
    | "SHARED_BURROW"
    | "FRIEND_FOLLOWS"
    | "THEY_FOLLOW"
    | "SHARED_FRIEND"

/**
 * A discovered user suggestion.
 *
 * @param userID The ID of the discovered user.
 * @param username The username of the discovered user.
 * @param name The name of the discovered user.
 * @param reasoning The reason this user was suggested.
 */
export type DiscoveredUser = {
    userID: string
    username: string
    name: string
    reasoning: DiscoverReasoning
}

/**
 * Info about a blocked user.
 *
 * @param userID The ID of the blocked user.
 * @param username The username of the blocked user.
 * @param name The name of the blocked user.
 * @param blockedAt When the user was blocked.
 */
export type BlockedUserInfo = {
    userID: string
    username: string
    name: string
    blockedAt: number
}

/**
 * A pair of tokens returned when a session is refreshed.
 */
export type RefreshedSession = {
    token: string
    refreshToken: string
}
