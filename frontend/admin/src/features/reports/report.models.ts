/**
 * A user-generated report.
 *
 * @param id The UUID of the report.
 * @param userId The author of the report.
 * @param summary The summary of the report.
 * @param details Longer details of the issue.
 * @param category The type of report.
 * @param path Where the user reported from.
 * @param userAgent The user's browser.
 * @param burrowInfo Burrow's verison.
 * @param createdAt When the report was created.
 */
export type Report = {
    id: string
    userId: string
    summary: string
    details: string
    category: string
    path: string
    userAgent: string
    burrowInfo: string
    createdAt: number
}
