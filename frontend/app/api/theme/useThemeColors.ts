import { useColorScheme } from "nativewind"
import { themeColors, type ThemeColors } from "./theme.types"

/**
 * Hook to get the current theme colors based on the active color scheme.
 *
 * Use this for cases where you need actual color values (e.g., Lucide icons).
 * For component styling, prefer using NativeWind classes like `className="bg-background text-text"`.
 *
 * @example
 * const colors = useThemeColors()
 * <SearchIcon color={colors.text} />
 */
export function useThemeColors(): ThemeColors {
    const { colorScheme } = useColorScheme()
    return colorScheme === "dark" ? themeColors.dark : themeColors.light
}
