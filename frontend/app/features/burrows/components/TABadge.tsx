import ThemedIcon from "@components/core/ThemedIcon"
import { GraduationCap, MapPin} from "lucide-react-native"
import { Text, View } from "react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * A badge that indicates a TA.
 *
 * @author AJ Kneisl
 */
export default function TABadge() {
    const colors = useThemeColors()

    return (
        <View
            className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
            style={{ backgroundColor: `${colors.info}33` }}
        >
            <ThemedIcon
                icon={GraduationCap}
                size={14}
                overrideColor={"info"}
                strokeWidth={2.5}
            />

            <Text className="text-xs font-bold" style={{ color: colors.info }}>
                TA
            </Text>
        </View>
    )
}
