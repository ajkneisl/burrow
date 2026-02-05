import { View, Text } from "react-native"
import { User } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * {@link CapacityBadge}
 */
type CapacityBadgeProps = {
    joined: number
    capacity: number
}

/**
 * A capacity badge showing joined/capacity with color-coded fill.
 *
 * @param joined Number of people joined.
 * @param capacity Maximum capacity.
 *
 * @author AJ Kneisl
 */
export function CapacityBadge({ joined, capacity }: CapacityBadgeProps) {
    const colors = useThemeColors()

    const hasLimit = capacity > 0
    const fillPct =
        hasLimit && capacity > 0 ? Math.min(joined / capacity, 1) * 100 : 0

    const getCapacityColor = () => {
        if (!hasLimit) return colors.info
        if (joined >= capacity) return colors.error
        if (joined / capacity >= 0.8) return colors.warn
        return colors.success
    }
    const capacityColor = getCapacityColor()

    if (joined === -1) return null

    return (
        <View
            className="flex-row items-center gap-1.5 px-3 py-1 rounded-full overflow-hidden border"
            style={{
                borderColor: capacityColor,
                backgroundColor: `${capacityColor}1A`
            }}
        >
            {/* Fill bar */}
            {hasLimit && (
                <View
                    className="absolute left-0 top-0 bottom-0"
                    style={{
                        width: `${fillPct}%`,
                        backgroundColor: `${capacityColor}33`
                    }}
                />
            )}
            <User size={14} color={capacityColor} />
            <Text
                className="text-xs font-medium"
                style={{ color: capacityColor }}
            >
                {hasLimit ? `${joined}/${capacity}` : "No limit"}
            </Text>
        </View>
    )
}
