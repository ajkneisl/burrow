import { del, get, post, put } from "@api/api"
import {
    BlockedUserInfo,
    BurrowReportCategory,
    ReportPayload,
    UserReportCategory
} from "./profile.types"

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

/**
 * Report a user.
 *
 * @param userID The ID of the user being reported
 * @param category The category of the report
 * @param details Additional details about the report
 */
export async function reportUser(
    userID: string,
    category: UserReportCategory,
    details: string
): Promise<string> {
    const payload: ReportPayload = {
        reportType: "USER",
        summary: `User report: ${category}`,
        category,
        details,
        attachedID: userID
    }

    return post("/report", payload)
}

/**
 * Report a burrow.
 *
 * @param burrowID The ID of the burrow being reported
 * @param category The category of the report
 * @param details Additional details about the report
 */
export async function reportBurrow(
    burrowID: string,
    category: BurrowReportCategory,
    details: string
): Promise<string> {
    const payload: ReportPayload = {
        reportType: "BURROW",
        summary: `Burrow report: ${category}`,
        category,
        details,
        attachedID: burrowID
    }

    return post("/report", payload)
}
