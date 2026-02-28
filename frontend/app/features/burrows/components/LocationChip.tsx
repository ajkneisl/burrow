import { useThemeColors } from "@api/theme/useThemeColors"
import { Text, View } from "react-native"
import { MapPin } from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"
import {useMemo} from "react";

/**
 * {@link LocationChip}
 */
type LocationChipProps = {
    location: string
}

/**
 * The stylized locatioj chip.
 *
 * @param location The Burrow's location..
 *
 * @author AJ Kneisl
 */
export default function LocationChip({ location }: LocationChipProps) {
    const colors = useThemeColors()

    const shortenedLocation = useMemo(() => {
        let initialLocation = location

        if (location.includes(",")) {
            initialLocation = initialLocation.split(",")[0]
        }

        return initialLocation.substring(0, 16)
    }, [location])

    return (
        <View
            className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
            style={{ backgroundColor: `${colors.secondary}33` }}
        >
            <ThemedIcon
                icon={MapPin}
                size={14}
                overrideColor={"secondary"}
                strokeWidth={2.5}
            />

            <Text
                className="text-xs font-bold"
                style={{ color: colors.secondary }}
                numberOfLines={1}
            >
                {shortenedLocation}
            </Text>
        </View>
    )
}
