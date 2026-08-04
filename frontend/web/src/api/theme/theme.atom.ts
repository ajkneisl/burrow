import type { Theme } from "@umnburrow/core/api"
import { atomWithStorage } from "jotai/utils"
/**
 * The theme of the website. Stored locally and synced with backend.
 */
export const themeAtom = atomWithStorage<Theme>("theme", "LIGHT")
