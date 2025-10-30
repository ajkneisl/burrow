import type { AnalyticsResponse } from "./analytics.models.ts"
import { BASE_URL } from "../auth/admin.atom.ts"

/**
 * Fetch all analytics.
 *
 * @param token The authorization token.
 */
export async function fetchAnalytics(
    token?: string
): Promise<AnalyticsResponse> {
    const res = await fetch(`${BASE_URL}/admin/analytics`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include"
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}
