import type { SubmittedBurrow } from "@features/burrows/create/create.types.ts"
import type { Burrow } from "@features/burrows/burrows.types.ts"
import { patch, post } from "@api/api.ts"

/**
 * Create a group.
 *
 * @param submittedGroup The submitted group.
 */
export async function createMeeting(
    submittedGroup: SubmittedBurrow
): Promise<Burrow> {
    return post(`/burrows`, submittedGroup)
}

/**
 * Modify a group.
 *
 * @param meetingId The ID of the meeting to update.
 * @param updatedGroup The updated group.
 */
export async function updateMeeting(
    meetingId: string,
    updatedGroup: SubmittedBurrow
) {
    return patch(`/burrows/${meetingId}`, updatedGroup)
}
