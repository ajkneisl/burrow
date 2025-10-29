import type { User } from "@features/auth/api/user.types.ts"
import type { GroupMeeting } from "@features/groups/api/groups.types.ts"

/**
 * A user's profile.
 */
export type Profile = {
    userID: string
    name: string
    gradYear: number | null
    classes: string[] | null
    bio: string | null
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
