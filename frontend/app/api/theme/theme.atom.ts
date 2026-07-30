import type { Theme } from "@umnburrow/core/api"
import { atomWithAsyncStorage } from "@api/util"

/**
 * The theme of the app.
 */
export const themeAtom = atomWithAsyncStorage<Theme>("theme", "DARK")
