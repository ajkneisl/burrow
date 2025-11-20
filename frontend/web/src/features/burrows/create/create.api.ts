import type { SubmittedBurrow } from "@features/burrows/create/create.types.ts"
import type { Burrow } from "@features/burrows/burrows.types.ts"
import { patch, post } from "@api/api.ts"

/**
 * Create a Burrow.
 *
 * @param submittedBurrow The submitted burrow.
 */
export async function createBurrow(
    submittedBurrow: SubmittedBurrow
): Promise<Burrow> {
    return post(`/burrows`, submittedBurrow)
}

/**
 * Modify a Burrow.
 *
 * @param burrowID The ID of the Burrow to update.
 * @param updatedGroup The updated group.
 */
export async function updateBurrow(
    burrowID: string,
    updatedGroup: SubmittedBurrow
) {
    return patch(`/burrows/${burrowID}`, updatedGroup)
}
