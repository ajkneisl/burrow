import { View, TextInput } from "react-native"
import { MapPin } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

interface LocationSelectorProps {
    value: string
    onLocationSelect: (location: {
        address: string
        latitude?: number
        longitude?: number
    }) => void
    placeholder?: string
}

export function LocationSelector({
    value,
    onLocationSelect,
    placeholder = "Enter a location..."
}: LocationSelectorProps) {
    const colors = useThemeColors()

    const handleChange = (text: string) => {
        onLocationSelect({ address: text })
    }

    return (
        <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-background px-4">
            <MapPin size={20} color={colors.text} style={{ opacity: 0.6 }} />
            <TextInput
                value={value}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-text py-3"
            />
        </View>
    )
}
