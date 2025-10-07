import { BASE_URL } from "@api/util.ts"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"

/**
 * Get the schedule.
 *
 * @param auth The authorization token.
 */
export async function getSchedule(
    auth: string
): Promise<GroupMeetingResponse[]> {
    const request = await fetch(`${BASE_URL}/groups/schedule`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await request.json()
}
