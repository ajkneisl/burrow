import type {
    Profile,
    RelationView,
    UserResponse
} from "@features/profile/profile.model.ts"
import { BASE_URL } from "@api/util.ts"
import { get, post } from "@api/api.ts"

/**
 * Get a user by their username.
 *
 * @param username The username.
 */
export async function getUserByUsername(
    username: string
): Promise<UserResponse> {
    return get(`/user/username/${username}`)
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

/**
 * Save an updated profile.
 *
 * @param profile The updated attributes of the profile.
 */
export async function saveProfile(profile: Record<keyof Profile, string>) {
    let parsedProfile: Partial<Profile> = {
        ...profile,
        visibility: profile.visibility.toUpperCase() as
            | "PUBLIC"
            | "PRIVATE"
            | "FRIENDS",
        gradYear: profile.gradYear ? parseInt(profile.gradYear) : null,
        classes: profile.classes
            ? profile.classes
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
            : []
    }

    Object.keys(parsedProfile).forEach((key) => {
        const value = parsedProfile[key as keyof Profile]

        if (
            (value === undefined || value === "") &&
            key !== "userID" &&
            key !== "name"
        ) {
            parsedProfile = {
                ...parsedProfile,
                [key as keyof Profile]: null
            }
        }
    })

    return post("/user/profile", parsedProfile)
}

/**
 * A view of the {@see ViewRelations} modal that displays friends.
 */
export const FRIENDS_VIEW: RelationView = {
    key: "friends",
    title: "My Friends"
}

/**
 * A view of the {@see ViewRelations} modal that displays followers.
 */
export const FOLLOWERS_VIEW: RelationView = {
    key: "followers",
    title: "My Followers"
}

/**
 * A view of the {@see ViewRelations} modal that displays users who you're following.
 */
export const FOLLOWING_VIEW: RelationView = {
    key: "following",
    title: "My Following"
}
