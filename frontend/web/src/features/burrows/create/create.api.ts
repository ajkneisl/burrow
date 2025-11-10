import type { SubmittedBurrow } from "@features/burrows/create/create.types.ts"
import type { Burrow } from "@features/burrows/burrows.types.ts"
import { BASE_URL } from "@api/util.ts"

/**
 * Create a group.
 *
 * @param auth The authorization token.
 * @param submittedGroup The submitted group.
 */
export async function createMeeting(
    auth: string,
    submittedGroup: SubmittedBurrow
): Promise<Burrow | string[]> {
    const request = await fetch(`${BASE_URL}/burrows`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth
        },
        body: JSON.stringify(submittedGroup)
    })

    if (!request.ok) {
        return (await request.json()).errors
    }

    return await request.json()
}

/**
 * Modify a group.
 *
 * @param auth The authorization token.
 * @param meetingId The ID of the meeting to update.
 * @param updatedGroup The updated group.
 */
export async function updateMeeting(
    auth: string,
    meetingId: string,
    updatedGroup: SubmittedBurrow
) {
    const request = await fetch(`${BASE_URL}/burrows/${meetingId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth
        },
        body: JSON.stringify(updatedGroup)
    })

    if (!request.ok) {
        return (await request.json()).errors
    }
}
