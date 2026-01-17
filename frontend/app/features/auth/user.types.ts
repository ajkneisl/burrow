/**
 * The authorized user.
 *
 * @param user The user object.
 * @param newUser If the user's account is new.
 * @param token An authorization token.
 */
export type AuthorizedUser = {
    user: User
    newUser: boolean
    token: string
}

/**
 * A user object.
 *
 * @param googleID The ID provided by Google.
 * @param name The user-selected (initially from Google) name.
 * @param email The email provided by Google. (unchangeable)
 * @param phoneNumber The user-selected phone number. (optional)
 * @param createdAt When the user created their account.
 */
export type User = {
    id: string
    username: string
    email: string
    phoneNumber: string
    createdDate: number
}

/**
 * This resembles a relation between two users, primarily in the form of a Follower or Friend.
 *
 * @param userID The ID of the friend.
 * @param username The username of the friend.
 * @param name The name of the friend.
 * @param friendsAt When you became friends. This is undefined if they're not friends, or that wasn't the relation that was retrieved.
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
