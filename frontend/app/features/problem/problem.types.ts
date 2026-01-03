export type ReportCategory =
    | "Bug"
    | "Content"
    | "Performance"
    | "Accessibility"
    | "Other"

/**
 * Payload for submitting a problem report.
 */
export type ReportProblemPayload = {
    /** Brief summary of the problem */
    summary: string
    /** Detailed description of the problem */
    details: string
    /** Category of the problem */
    category: ReportCategory
    /** Current path/route where the problem occurred */
    path: string
    /** User agent string */
    userAgent: string
    /** Additional burrow-related context (if applicable) */
    burrowInfo: string
}
