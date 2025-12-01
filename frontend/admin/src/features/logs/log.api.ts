import type { LogsResponse } from "./log.models.ts"
import { BASE_URL } from "../auth/admin.atom.ts"

/**
 * Get logs with optional filters.
 *
 * @param token The authorization token.
 * @param page The page number (default 1).
 * @param level Optional log level filter (DEBUG, INFO, WARN, ERROR, FATAL).
 * @param source Optional source filter.
 * @param userID Optional user ID filter.
 */
export async function getLogs(
    token: string,
    page = 1,
    level?: string,
    source?: string,
    userID?: string
): Promise<LogsResponse> {
    const params = new URLSearchParams({ page: page.toString() })
    if (level) params.append("level", level)
    if (source) params.append("source", source)
    if (userID) params.append("userID", userID)

    const res = await fetch(`${BASE_URL}/admin/logs?${params.toString()}`, {
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