import { atomWithStorage } from "jotai/utils"

/**
 * The theme of the website. true for dark, false for light :)
 */
export const themeAtom = atomWithStorage<boolean | null>("theme", null)
