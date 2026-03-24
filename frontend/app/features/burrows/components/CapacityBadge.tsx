import { View } from "react-native"
import { Text } from "@components/core"
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
            className="rounded-full flex-row items-center gap-1.5"
            style={{
                borderWidth: 1,
                paddingHorizontal: 11,
                paddingVertical: 4,
                borderColor: capacityColor,
                backgroundColor: `${capacityColor}1A`
            }}
        >
            <User size={14} color={capacityColor} strokeWidth={2.5} />

            <Text
                className="text-xs font-bold"
                style={{ color: capacityColor }}
            >
                {hasLimit ? `${joined}/${capacity}` : "No limit"}
            </Text>
        </View>
    )
}
