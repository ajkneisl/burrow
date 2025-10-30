import type { Report } from "./report.models.ts"
import { BASE_URL } from "../auth/admin.atom.ts"

/**
 * Get all reports.
 *
 * @param token The authorization token.
 */
export async function getReports(token: string): Promise<Report[]> {
    const res = await fetch(`${BASE_URL}/admin/reports`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}
