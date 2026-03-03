/** Report types matching the backend ReportType enum */
export type ReportType = "GENERAL" | "BURROW" | "USER" | "CHAT"

/** User report categories matching the backend */
export type UserReportCategory =
    | "Spam"
    | "Harassment"
    | "Inappropriate Content"
    | "Impersonation"
    | "Other"

/** Burrow report categories */
export type BurrowReportCategory =
    | "Spam"
    | "Inappropriate Content"
    | "Misleading Information"
    | "Harassment"
    | "Other"

/** A general report category. */
export type ReportCategory = BurrowReportCategory | UserReportCategory

/** Payload for submitting a report */
export type ReportPayload = {
    reportType: ReportType
    summary: string
    category: ReportCategory
    details: string
    userAgent?: string
    path?: string
    attachedID?: string
}

/**
 * Info about a blocked user.
 */
export type BlockedUserInfo = {
    userID: string
    username: string
    name: string
    blockedAt: number
}
