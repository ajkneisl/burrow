import { BASE_URL } from "@api/util.ts"
import type { AuthorizedUser, User } from "@features/auth/api/user.types.ts"

/**
 * Update a user.
 *
 * @param auth Authorization token.
 * @param key The attribute to change. (phone, name)
 * @param value The value to change the attribute to.
 */
export async function updateUser(auth: string, key: string, value: string) {
    const request = await fetch(`${BASE_URL}/user`, {
        method: "POST",
        body: new URLSearchParams({ key, value }),
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject("Failed to update user.")
    }
}

/**
 * Retrieve user information using the authorization token.
 *
 * @param auth The authorization token.
 */
export async function getUser(auth: string): Promise<User> {
    const request = await fetch(`${BASE_URL}/user`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject("Failed to get user.")
    }

    return await request.json()
}

/**
 * Retrieve the token and user details when logging in.
 *
 * @param credentials Google credentials provided from login.
 */
export async function login(credentials: string): Promise<AuthorizedUser> {
    const request = await fetch(`${BASE_URL}/user/login`, {
        method: "PUT",
        body: credentials
    })

    return await request.json()
}
