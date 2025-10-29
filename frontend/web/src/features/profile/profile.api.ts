import type { UserResponse } from "@features/profile/profile.model.ts"
import { BASE_URL } from "@api/util.ts"

/**
 * Get a user by their username.
 *
 * @param auth The authorization token.
 * @param username The username.
 */
export async function getUserByUsername(
    auth: string | null,
    username: string
): Promise<UserResponse> {
    const request = await fetch(`${BASE_URL}/user/username/${username}`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + auth
        }
    })

    if (!request.ok) return Promise.reject("Failed to load profile.")

    return await request.json()
}

/**
 * Get a user by their userID.
 *
 * @param auth The authorization token.
 * @param userID The user ID.
 */
export async function getUserByID(
    auth: string,
    userID: string
): Promise<UserResponse> {
    const request = await fetch(`${BASE_URL}/user/id/${userID}`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + auth
        }
    })

    if (!request.ok) return Promise.reject("Failed to load profile.")

    return await request.json()
}

/**
 * Follow a user.
 *
 * @param auth The authorization token.
 * @param userID The user to follow.
 */
export async function followUser(auth: string, userID: string) {
    const request = await fetch(
        `${BASE_URL}/user/profile/follow?userID=${userID}`,
        {
            method: "POST",
            headers: {
                Authorization: "Bearer " + auth
            }
        }
    )

    if (!request.ok) return Promise.reject("Failed to follow user.")
}

/**
 * Un-follow a user.
 *
 * @param auth The authorization token.
 * @param userID The user to unfollow.
 */
export async function unFollowUser(auth: string, userID: string) {
    const request = await fetch(
        `${BASE_URL}/user/profile/follow?userID=${userID}`,
        {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + auth
            }
        }
    )

    if (!request.ok) return Promise.reject("Failed to un-follow user.")
}
