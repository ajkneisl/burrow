import { post } from "@api/api"

/** Report types matching the backend ReportType enum */
export type ReportType = "GENERAL" | "BURROW" | "USER" | "CHAT"

/** User report categories matching the backend */
export type UserReportCategory =
    | "Spam"
    | "Harassment"
    | "Inappropriate Content"
    | "Impersonation"
    | "Other"

/** Payload for submitting a user report */
export type UserReportPayload = {
    reportType: ReportType
    summary: string
    category: UserReportCategory
    details: string
    userAgent?: string
    path?: string
    attachedID?: string
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
    const payload: UserReportPayload = {
        reportType: "USER",
        summary: `User report: ${category}`,
        category,
        details,
        attachedID: userID
    }

    return post("/report", payload)
}

/** Burrow report categories */
export type BurrowReportCategory =
    | "Spam"
    | "Inappropriate Content"
    | "Misleading Information"
    | "Harassment"
    | "Other"

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
    const payload: UserReportPayload = {
        reportType: "BURROW",
        summary: `Burrow report: ${category}`,
        category,
        details,
        attachedID: burrowID
    }

    return post("/report", payload)
}
