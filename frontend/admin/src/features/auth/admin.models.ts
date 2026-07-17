/**
 * The type of a user's account.
 */
export type AccountType = "USER" | "ADMIN"

/**
 * An administrator's account. This is a regular Burrow account with the
 * ADMIN account type.
 *
 * @param id The unique ID of the account.
 * @param username The username.
 * @param email The email.
 * @param accountType The account's type.
 * @param createdAt When the account was created.
 */
export type AdminAccount = {
    id: string
    username: string
    email: string
    accountType: AccountType
    createdAt: number
}

/**
 * A Burrow user, as returned by the main login endpoint.
 */
export type AuthorizedUser = {
    user: {
        id: string
        username: string
        accountType: AccountType
        createdAt: number
    }
    newUser: boolean
    token: string
    refreshToken: string
}
