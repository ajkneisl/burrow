import { View, Text, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { NotificationPreferencesComponent } from "@features/settings/components/NotificationPreferences"

/**
 * Notification preferences settings screen.
 */
export default function NotificationSettingsScreen() {
    const router = useRouter()
    const colors = useThemeColors()

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 mr-2 -ml-2"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-text">
                        Notification Preferences
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        Manage your notification settings
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                <NotificationPreferencesComponent />

                {/* Bottom Spacer */}
                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}
