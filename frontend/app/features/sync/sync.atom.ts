import { atom } from "jotai"
import type { Blocks, SyncStatus } from "./sync.types"

/**
 * The sync status of the focused burrow.
 */
export const syncStatus = atom<SyncStatus>("CONNECTING")

/**
 * The blocks enabled in the focused burrow.
 */
export const blockStatus = atom<Blocks[]>([])

/**
 * The status of attempting to reconnect.
 */
export const syncRetry = atom<string>("")
