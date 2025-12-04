import { get, post } from "@api/api.ts"
import type { Theme } from "@api/theme/theme.types.ts"

/**
 * Retrieve the theme from the backend.
 */
export async function getTheme(): Promise<Theme> {
    return await get<{ theme: Theme }>("/settings/theme").then((r) => r.theme)
}

/**
 * Save a theme.
 *
 * @param theme The theme to save.
 */
export async function saveTheme(theme: Theme): Promise<void> {
    return await post("/settings/theme", theme)
}
