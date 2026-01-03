import { View, TextInput, Pressable } from "react-native"
import { MapPin, X } from "lucide-react-native"
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

    const clearSelection = () => {
        onLocationSelect({ address: "" })
    }

    return (
        <View className="flex-row items-center border border-card-border rounded-lg px-4 py-3 bg-background">
            <MapPin size={18} color={colors.text} style={{ opacity: 0.6 }} />
            <TextInput
                value={value}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-text"
            />
            {value.length > 0 && (
                <Pressable onPress={clearSelection}>
                    <X size={18} color={colors.text} style={{ opacity: 0.6 }} />
                </Pressable>
            )}
        </View>
    )
}
