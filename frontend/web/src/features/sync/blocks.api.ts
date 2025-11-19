import { patch } from "@api/api.ts"

/**
 * Save the enabled blocks.
 *
 * @param burrowID The ID of the Burrow.
 * @param blocks The blocks that should be enabled.
 */
export async function saveBlocks(burrowID: string, blocks: string[]) {
    await patch(`/burrows/${burrowID}/block`, blocks)
}
