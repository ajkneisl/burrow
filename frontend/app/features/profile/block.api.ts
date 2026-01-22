import { del, get, put } from "@api/api"

/**
 * Get the list of blocked user IDs.
 */
export async function getBlockedUsers(): Promise<string[]> {
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
