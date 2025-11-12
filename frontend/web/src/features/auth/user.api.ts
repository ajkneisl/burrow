import { BASE_URL } from "@api/util.ts"
import type { AuthorizedUser, Relation } from "@features/auth/user.types.ts"
import type { UserResponse } from "@features/profile/profile.model.ts"
import { get, post, put } from "@api/api.ts"

/**
 * Update a username.
 *
 * @param value The value to change the username to.
 */
export async function updateUsername(value: string) {
    return post("/user", {
        username: value
    })
}

/**
 * Retrieve user information.
 */
export async function getUser(): Promise<UserResponse> {
    return get("/user")
}

/**
 * Retrieve the token and user details when logging in.
 *
 * @param credentials Google credentials provided from login.
 */
export async function login(credentials: string): Promise<AuthorizedUser> {
    return put("/user/login", credentials)
}

/**
 * Get all relations.
 *
 * @param auth The authorization token.
 * @param key The type of relation to retrieve.
 */
export async function getRelations(
    auth: string,
    key: string
): Promise<Relation[]> {
    const request = await fetch(`${BASE_URL}/user/relations/${key}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await request.json()
}
