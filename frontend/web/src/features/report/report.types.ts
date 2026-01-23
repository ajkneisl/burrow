/** User report categories */
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

/** General report categories */
export type ReportCategory =
    | "Bug"
    | "Content"
    | "Performance"
    | "Accessibility"
    | "Other"

export const USER_REPORT_CATEGORIES: UserReportCategory[] = [
    "Spam",
    "Harassment",
    "Inappropriate Content",
    "Impersonation",
    "Other"
]

export const BURROW_REPORT_CATEGORIES: BurrowReportCategory[] = [
    "Spam",
    "Inappropriate Content",
    "Misleading Information",
    "Harassment",
    "Other"
]

export type ReportType = "GENERAL" | "BURROW" | "USER" | "CHAT"

/**
 * A payload to create a report.
 */
export type ReportProblemPayload = {
    reportType: ReportType
    summary: string
    category: string
    details: string
    userAgent?: string
    path?: string
    attachedID?: string
}
