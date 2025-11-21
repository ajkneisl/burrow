import { atomWithStorage } from "jotai/utils"
import type { Theme } from "@api/theme/theme.types.ts"

/**
 * The theme of the website. Stored locally and synced with backend.
 */
export const themeAtom = atomWithStorage<Theme>("theme", "AUTO")
