import { View, Text, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { useRouter } from "expo-router"
import useUser from "@features/auth/hooks/useUser"
import useProfile from "@features/auth/hooks/useProfile"
import { Header } from "@features/layout/components"
import { Button } from "@components/core"
import { Settings, Edit } from "lucide-react-native"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import { EditableProfile } from "@features/profile/components/EditableProfile"
import { UserProfileView } from "@features/profile/components/UserProfileView"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Profile screen
 *
 * @author AJ Kneisl
 */
export default function ProfileScreen() {
    const user = useUser()
    const profile = useProfile()
    const router = useRouter()
    const { signOut } = useGoogleAuth()
    const colors = useThemeColors()

    const [isEditing, setIsEditing] = useState(false)

    if (!user || !profile) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text opacity-60">
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header
                title="Profile"
                showSearch={false}
                rightAction={
                    <Pressable
                        onPress={() => router.push("/settings")}
                        className="p-2"
                    >
                        <Settings size={24} color={colors.text} />
                    </Pressable>
                }
            />

            <ScrollView className="flex-1 px-6 py-4" contentContainerClassName="pb-4">
                {isEditing ? (
                    <EditableProfile
                        profile={profile}
                        onCancel={() => setIsEditing(false)}
                        onSave={() => setIsEditing(false)}
                    />
                ) : (
                    <UserProfileView
                        user={user}
                        profile={profile}
                        actionButton={
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => setIsEditing(true)}
                                leftIcon={
                                    <Edit size={16} color={colors.primary} />
                                }
                                className="mt-4"
                            >
                                Edit Profile
                            </Button>
                        }
                    />
                )}
            </ScrollView>

            {/* Sign Out - always at bottom */}
            {!isEditing && (
                <View className="px-6 pb-6">
                    <Button variant="outline" onPress={signOut}>
                        Sign Out
                    </Button>
                </View>
            )}
        </SafeAreaView>
    )
}
