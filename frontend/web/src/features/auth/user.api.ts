import type {
    AuthorizedUser,
    DiscoveredUser,
    Relation
} from "@features/auth/user.types.ts"
import type { UserResponse } from "@features/profile/profile.model.ts"
import { del, get, post, put } from "@api/api.ts"

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
    return put("/user/login", credentials, { auth: false })
}

/**
 * Get all relations.
 *
 * @param key The type of relation to retrieve.
 * @param forUserID The user ID to search for
 */
export async function getRelations(
    key: string,
    forUserID?: string
): Promise<Relation[]> {
    return get(`/user/relations/${key}`, { query: { userID: forUserID } })
}

/**
 * Get discovered user suggestions.
 */
export async function getDiscoveredUsers(): Promise<DiscoveredUser[]> {
    return get("/user/relations/discover")
}

/**
 * Delete the current user's account.
 */
export async function deleteAccount(): Promise<void> {
    return del("/user")
}
