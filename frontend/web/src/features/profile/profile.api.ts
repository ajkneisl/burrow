import type {
    Profile,
    RelationView,
    UserResponse
} from "@features/profile/profile.model.ts"
import { BASE_URL } from "@api/util.ts"
import { del, get, post } from "@api/api.ts"

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
 * Unblock a user.
 *
 * @param userID The ID of the user to unblock.
 */
export async function unblockUser(userID: string): Promise<void> {
    return del("/user/block", { query: { userID } })
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
 * @param userID The user to follow.
 */
export async function followUser(userID: string) {
    return await post("/user/relations/follow", undefined, {
        query: { userID }
    })
}

/**
 * Un-follow a user.
 *
 * @param userID The user to unfollow.
 */
export async function unFollowUser(userID: string) {
    return await del("/user/relations/follow", {
        query: { userID }
    })
}

/**
 * Save an updated profile.
 *
 * @param profile The updated attributes of the profile.
 */
export async function saveProfile(profile: Record<keyof Profile, string>) {
    let parsedProfile: Partial<Profile> = {
        ...profile,
        badges: [],
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
 * A view of the {@see ViewRelations} modal that displays followers.
 */
export const FOLLOWERS_VIEW = (forUserID?: string): RelationView => ({
    key: "followers",
    title: "Followers",
    forUserID
})

/**
 * A view of the {@see ViewRelations} modal that displays users who you're following.
 */
export const FOLLOWING_VIEW = (forUserID?: string): RelationView => ({
    key: "following",
    title: "Following",
    forUserID
})
