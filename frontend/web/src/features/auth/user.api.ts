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
 * @param key The type of relation to retrieve.
 */
export async function getRelations(key: string): Promise<Relation[]> {
    return get(`/user/relations/${key}`)
}
