import { patch } from "@api/api"

/**
 * Save the enabled blocks for a burrow.
 *
 * @param burrowID The ID of the burrow
 * @param blocks The blocks that should be enabled (e.g., ["CHAT", "POMODORO"])
 */
export async function saveBlocks(
    burrowID: string,
    blocks: string[]
): Promise<void> {
    await patch(`/burrows/${burrowID}/block`, blocks)
}
