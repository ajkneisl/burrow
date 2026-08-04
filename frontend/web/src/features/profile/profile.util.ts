import { saveProfile } from "@umnburrow/core/api"
import type {
    DiscoverReasoning,
    Profile,
    ProfileVisibility
} from "@umnburrow/core/api"
import type { RelationView } from "@features/profile/profile.model.ts"
/**
 * Get ar readable label for a {@link DiscoverReasoning}.
 */
export function getReasoningLabel(reasoning: DiscoverReasoning): string {
    switch (reasoning) {
        case "SHARED_BURROW":
            return "Shares some Burrows"
        case "FRIEND_FOLLOWS":
            return "Followed by friends"
        case "THEY_FOLLOW":
            return "Follows you"
        case "SHARED_FRIEND":
            return "Friend of friends"
        default:
            return ""
    }
}

/**
 * A view of the relations modal that displays followers.
 */
export const FOLLOWERS_VIEW = (forUserID?: string): RelationView => ({
    key: "followers",
    title: "Followers",
    forUserID
})

/**
 * A view of the relations modal that displays users who you're following.
 */
export const FOLLOWING_VIEW = (forUserID?: string): RelationView => ({
    key: "following",
    title: "Following",
    forUserID
})

/**
 * Save an updated profile from the edit form, which holds every field as a
 * string.
 *
 * @param profile The updated attributes of the profile.
 */
export async function saveProfileForm(profile: Record<keyof Profile, string>) {
    let parsedProfile: Partial<Profile> = {
        ...profile,
        badges: [],
        visibility: profile.visibility.toUpperCase() as ProfileVisibility,
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

    return saveProfile(parsedProfile)
}
