import type { User } from "@features/auth/user.types.ts"
import type { GroupMeeting } from "@features/groups/groups.types.ts"

/**
 * A user's profile.
 */
export type Profile = {
    userID: string
    name: string
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE"
    gradYear: number | null
    classes: string[] | null
    bio: string | null
    instagram: string | null
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
    recentJoinedGroups: GroupMeeting[]
    recentHostedGroups: GroupMeeting[]
}
