import { View, Text, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import useProfile from "@features/auth/hooks/useProfile"
import { EditableProfile } from "@features/profile/components/EditableProfile"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Edit profile settings page.
 *
 * @author AJ Kneisl
 */
export default function EditProfileScreen() {
    const router = useRouter()
    const profile = useProfile()
    const colors = useThemeColors()

    if (!profile) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text opacity-60">Loading...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <Text className="text-2xl font-bold text-text">Edit Profile</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                <EditableProfile
                    profile={profile}
                    onCancel={() => router.back()}
                    onSave={() => router.back()}
                />
            </ScrollView>
        </SafeAreaView>
    )
}
