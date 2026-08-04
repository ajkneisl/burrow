import { post } from "../client"
import type {
    BurrowReportCategory,
    SubmittedReport,
    UserReportCategory
} from "./reports.models"

/**
 * Submit a report.
 *
 * @param report The report to submit.
 */
export async function submitReport(report: SubmittedReport): Promise<string> {
    return post("/report", report)
}

/**
 * Report a user.
 *
 * @param userID The ID of the user being reported.
 * @param category The category of the report.
 * @param details Additional details about the report.
 */
export async function reportUser(
    userID: string,
    category: UserReportCategory,
    details: string
): Promise<string> {
    return submitReport({
        reportType: "USER",
        summary: `User report: ${category}`,
        category,
        details,
        attachedID: userID
    })
}

/**
 * Report a Burrow.
 *
 * @param burrowID The ID of the Burrow being reported.
 * @param category The category of the report.
 * @param details Additional details about the report.
 */
export async function reportBurrow(
    burrowID: string,
    category: BurrowReportCategory,
    details: string
): Promise<string> {
    return submitReport({
        reportType: "BURROW",
        summary: `Burrow report: ${category}`,
        category,
        details,
        attachedID: burrowID
    })
}
