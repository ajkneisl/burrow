import { BASE_URL } from "@api/util.ts"

/**
 * Save the enabled blocks.
 *
 * @param auth The authorization token.
 * @param meetingId The ID of the meeting.
 * @param blocks The blocks that should be enabled.
 */
export async function saveBlocks(auth: string, meetingId: string, blocks: string[]) {
    await fetch(`${BASE_URL}/groups/${meetingId}/block`, {
        method: "PATCH",
        body: JSON.stringify(blocks),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`
        }
    })
}
