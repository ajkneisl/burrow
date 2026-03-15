import { View } from "react-native"
import { Text } from "@components/core"
import { Search } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

export function SearchEmptyState() {
    const colors = useThemeColors()

    return (
        <View className="flex-1 items-center justify-center px-8">
            <View
                className="rounded-full p-5 mb-4"
                style={{ backgroundColor: `${colors.text}10` }}
            >
                <Search
                    size={32}
                    color={colors.text}
                    style={{ opacity: 0.3 }}
                />
            </View>
            <Text
                className="text-center font-medium"
                style={{ color: `${colors.text}99`, fontSize: 17 }}
            >
                Search for Burrows or users
            </Text>
            <Text
                className="text-center mt-2"
                style={{ color: `${colors.text}60`, fontSize: 14 }}
            >
                Find study groups, events, and connect with Gophers
            </Text>
        </View>
    )
}