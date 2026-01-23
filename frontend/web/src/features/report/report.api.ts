import { post } from "@api/api.ts"
import type { ReportProblemPayload } from "@features/report/report.types.ts"

/**
 * submit a report
 *
 * @param report The report to submit.
 */
export async function submitReport(
    report: ReportProblemPayload
): Promise<string> {
    return post("/report", report)
}
