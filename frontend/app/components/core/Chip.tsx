import { View } from "react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { LucideIcon } from "lucide-react-native"

type ChipColor = "primary" | "secondary" | "error" | "success" | "info" | "warn"
type ChipSize = "sm" | "md" | "lg"

/**
 * {@link Chip}
 */
type ChipProps = {
    /** The size of the chip. */
    size?: ChipSize
    /** The theme color used for the background tint and text. */
    color?: ChipColor
    /** Text label to display. */
    label?: string
    /** Optional Lucide icon displayed before the label. */
    icon?: LucideIcon
    /** Alternative to label — rendered as children. */
    children?: React.ReactNode
}

/** Padding, text size, and icon size per chip size. */
const SIZE_STYLES = {
    sm: { container: "px-2 py-0.5", text: "text-[10px]", icon: 10 },
    md: { container: "px-2.5 py-1", text: "text-xs", icon: 12 },
    lg: { container: "px-3 py-1.5", text: "text-sm", icon: 14 }
}

/**
 * A small, rounded badge for displaying labels with an optional icon.
 * Uses theme colors with a translucent background tint.
 *
 * @author AJ Kneisl
 */
export function Chip({
    size = "md",
    color = "primary",
    label,
    icon: Icon,
    children
}: ChipProps) {
    const colors = useThemeColors()
    const s = SIZE_STYLES[size]
    const tint = colors[color]

    return (
        <View
            className={`rounded-full flex-row items-center gap-1 ${s.container}`}
            style={{ backgroundColor: `${tint}26` }}
        >
            {Icon && (
                <Icon size={s.icon} strokeWidth={2.5} color={tint} />
            )}

            {(label || children) && (
                <Text
                    className={`${s.text} font-semibold`}
                    style={{ color: tint }}
                >
                    {label ?? children}
                </Text>
            )}
        </View>
    )
}
