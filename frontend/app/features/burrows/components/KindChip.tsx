import { BURROW_KIND_CONFIG, BurrowKind } from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import { View } from "react-native"
import { Text } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import { MapPin } from "lucide-react-native"

/**
 * {@link KindChip}
 */
type KindChipProps = {
    kind: BurrowKind
}

/**
 * The stylized kind chip.
 *
 * @param kind The Burrow kind.
 *
 * @author AJ Kneisl
 */
export default function KindChip({ kind }: KindChipProps) {
    const colors = useThemeColors()

    const kindConfig = BURROW_KIND_CONFIG[kind] || BURROW_KIND_CONFIG.STUDY
    const KindIcon = kindConfig.Icon
    const kindColor = colors[kindConfig.colorKey]

    return (
        <View
            className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
            style={{ backgroundColor: `${kindColor}33` }}
        >
            <ThemedIcon
                icon={KindIcon}
                size={14}
                regularColor={kindColor}
                strokeWidth={2.5}
            />

            <Text className="text-xs font-bold" style={{ color: kindColor }}>
                {kindConfig.label}
            </Text>
        </View>
    )
}
