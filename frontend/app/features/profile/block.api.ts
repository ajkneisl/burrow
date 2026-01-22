import { del, get, put } from "@api/api"

/**
 * Info about a blocked user.
 */
export type BlockedUserInfo = {
    userID: string
    username: string
    name: string
    blockedAt: number
}

/**
 * Get the list of blocked users with details.
 */
export async function getBlockedUsers(): Promise<BlockedUserInfo[]> {
    return get("/user/block")
}

/**
 * Block a user.
 *
 * @param userID The ID of the user to block
 */
export async function blockUser(userID: string): Promise<void> {
    return put("/user/block", undefined, { query: { userID } })
}

/**
 * Unblock a user.
 *
 * @param userID The ID of the user to unblock
 */
export async function unblockUser(userID: string): Promise<void> {
    return del("/user/block", { query: { userID } })
}
