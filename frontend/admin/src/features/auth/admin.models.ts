/**
 * The administrator.
 *
 * @param id The unique ID of the admin.
 * @param username The username.
 * @param email The email.
 * @param permissionBits The permissions of the administrator.
 * @param createdAt When the account was created.
 * @param lastLoginAt When the user last logged in.
 * @param lastLoginIp The IP of the last user logged in.
 * @param passwordUpdatedAt When the password was updated.
 */
export type Administrator = {
    id: string
    username: string
    email: string
    permissionBits: number
    createdAt: number
    lastLoginAt: number | null
    lastLoginIp: string | null
    passwordUpdatedAt: number
}

/**
 * A response to logging in.
 *
 * @param token The authorization token.
 * @param author The user who logged in.
 */
export type AdminLoginResponse = {
    token: string
    author: Administrator
}