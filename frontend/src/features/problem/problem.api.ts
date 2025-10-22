import { BASE_URL } from "@api/util.ts"

export type ReportCategory =
    | "Bug"
    | "Content"
    | "Performance"
    | "Accessibility"
    | "Other"

/**
 * A payload to create a problem
 */
export type ReportProblemPayload = {
    summary: string
    details: string
    category: ReportCategory
    path: string
    userAgent: string
    burrowInfo: string
}

/**
 * submit a report
 */
export async function submitReport(auth: string, report: ReportProblemPayload) {
    const request = await fetch(`${BASE_URL}/report`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`
        },
        body: JSON.stringify(report)
    })

    return await request.text()
}
