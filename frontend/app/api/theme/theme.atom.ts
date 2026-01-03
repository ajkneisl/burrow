import { atomWithAsyncStorage } from "@api/util"
import type { Theme } from "@api/theme/theme.types"

/**
 * The theme of the app.
 */
export const themeAtom = atomWithAsyncStorage<Theme>("theme", "DARK")
