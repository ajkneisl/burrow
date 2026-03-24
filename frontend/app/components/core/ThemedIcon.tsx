import { useThemeColors } from "@api/theme/useThemeColors"
import { LucideIcon } from "lucide-react-native"

/**
 * {@link ThemedIcon}
 */
type ThemedIconProps = {
    icon: LucideIcon
    size: number
    opacity?: number
    regularColor?: string
    overrideColor?:
        | "secondary"
        | "primary"
        | "info"
        | "error"
        | "success"
        | "warn"
    strokeWidth?: number
}

/**
 * An icon that has proper themed colors.
 *
 * @param Icon The icon this should be.
 * @param size The size of the icon.
 * @param overrideColor If the color should be overridden.
 * @param opacity An optional opacity.
 * @param regularColor A regular color to override with.
 * @param strokeWidth An optional stroke width.
 *
 * @author AJ Kneisl
 */
export default function ThemedIcon({
    icon: Icon,
    size,
    overrideColor,
    opacity,
    regularColor,
    strokeWidth
}: ThemedIconProps) {
    const colors = useThemeColors()

    const color =
        regularColor ?? (overrideColor ? colors[overrideColor] : colors.text)

    return (
        <Icon
            size={size}
            color={color}
            style={{ opacity: opacity ?? 1 }}
            strokeWidth={strokeWidth}
        />
    )
}
