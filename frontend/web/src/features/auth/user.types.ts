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
 * A friend. This is someone that both you follow and they follow you.
 *
 * @param userID The ID of the friend.
 * @param username The username of the friend.
 * @param name The name of the friend.
 * @param friendsAt When you became friends.
 */
export type Friend = {
    userID: string
    username: string
    name: string
    friendsAt: number
}
