import { post } from "@api/api"
import type { ReportProblemPayload } from "./problem.types"

/**
 * Submit a problem report.
 *
 * @param report The problem report payload
 * @returns Response text from the server
 */
export async function submitReport(
    report: ReportProblemPayload
): Promise<string> {
    return await post("/report", report)
}
