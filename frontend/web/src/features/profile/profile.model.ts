import type { User } from "@features/auth/user.types.ts"
import type { Burrow } from "@features/burrows/burrows.types.tsx"

/**
 * A user's profile.
 */
export type Profile = {
    userID: string
    name: string
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE"
    gradYear: number | null
    classes: string[] | null
    school: string | null
    major: string | null
    bio: string | null
    instagram: string | null
    linkedIn: string | null
    phoneNumber: string | null
}

/**
 * A user's following information.
 */
export type Following = {
    following: number
    followers: number
    mutuals: number
    theyFollow: boolean
    youFollow: boolean
}

/**
 * A response from retrieving a user.
 */
export type UserResponse = {
    user: User
    profile: Profile
    following: Following
    recentJoinedGroups: Burrow[]
    recentHostedGroups: Burrow[]
    email?: string
}

/**
 * A view for the relations modal.
 *
 * @param title The title of the modal.
 * @param func The function to retrieve the data. This is some-sort of user relation.
 * @param queryKey The key to not replicate the request.
 */
export type RelationView = {
    title: string
    key: string
}
