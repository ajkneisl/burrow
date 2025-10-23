import { atom } from "jotai"
import type { Blocks, SyncStatus } from "@features/sync/api/sync.types.ts"

/**
 * The sync status of the focused meeting.
 */
export const syncStatus = atom<SyncStatus>("CONNECTING")

/**
 * The blocks enabled in the focused meeting.
 */
export const blockStatus = atom<Blocks[]>([])
