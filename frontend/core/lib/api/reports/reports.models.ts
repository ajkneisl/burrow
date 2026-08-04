/**
 * The type of a report. Each type accepts its own set of categories.
 */
export type ReportType = "GENERAL" | "BURROW" | "USER" | "CHAT"

/**
 * General report categories.
 */
export type GeneralReportCategory =
    | "Bug"
    | "Content"
    | "Performance"
    | "Accessibility"
    | "Other"

/**
 * Burrow report categories.
 */
export type BurrowReportCategory =
    | "Inappropriate Content"
    | "Misleading Information"
    | "Spam"
    | "Other"

/**
 * User report categories.
 */
export type UserReportCategory =
    | "Spam"
    | "Harassment"
    | "Inappropriate Content"
    | "Impersonation"
    | "Other"

/**
 * Chat report categories.
 */
export type ChatReportCategory =
    | "Harassment"
    | "Spam"
    | "Inappropriate Content"
    | "Other"

/**
 * Any category a report may carry.
 */
export type ReportCategory =
    | GeneralReportCategory
    | BurrowReportCategory
    | UserReportCategory
    | ChatReportCategory

/**
 * The categories a problem may be reported under.
 */
export const GENERAL_REPORT_CATEGORIES: GeneralReportCategory[] = [
    "Bug",
    "Content",
    "Performance",
    "Accessibility",
    "Other"
]

/**
 * The categories a Burrow may be reported for.
 */
export const BURROW_REPORT_CATEGORIES: BurrowReportCategory[] = [
    "Inappropriate Content",
    "Misleading Information",
    "Spam",
    "Other"
]

/**
 * The categories a user may be reported for.
 */
export const USER_REPORT_CATEGORIES: UserReportCategory[] = [
    "Spam",
    "Harassment",
    "Inappropriate Content",
    "Impersonation",
    "Other"
]

/**
 * The categories a chat message may be reported for.
 */
export const CHAT_REPORT_CATEGORIES: ChatReportCategory[] = [
    "Harassment",
    "Spam",
    "Inappropriate Content",
    "Other"
]

/**
 * The categories the backend accepts for each {@link ReportType}.
 */
export const REPORT_CATEGORIES: Record<ReportType, ReportCategory[]> = {
    GENERAL: GENERAL_REPORT_CATEGORIES,
    BURROW: BURROW_REPORT_CATEGORIES,
    USER: USER_REPORT_CATEGORIES,
    CHAT: CHAT_REPORT_CATEGORIES
}

/**
 * A report to submit.
 *
 * @param reportType The type of report.
 * @param summary A short summary of the problem.
 * @param category The category, which must be valid for {@link reportType}.
 * @param details A longer description of the problem.
 * @param userAgent The reporter's user agent, or device details on mobile.
 * @param path Where in the app the report was made from.
 * @param attachedID The ID of the attached item, like a Burrow or user.
 */
export type SubmittedReport = {
    reportType: ReportType
    summary: string
    category: ReportCategory
    details: string
    userAgent?: string
    path?: string
    attachedID?: string
}

/**
 * A stored report, as returned to administrators.
 */
export type Report = {
    id: string
    userID: string
    reportType: ReportType
    summary: string
    details: string
    category: string
    path: string | null
    userAgent: string | null
    attachedID: string | null
    createdAt: number
}
