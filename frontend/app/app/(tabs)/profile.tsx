import { useState, useCallback } from "react"
import { View, RefreshControl, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import useUser from "@features/auth/hooks/useUser"
import useProfile from "@features/auth/hooks/useProfile"
import { getUser } from "@features/auth/user.api"
import { Header } from "@features/layout/components"
import { Button, Text } from "@components/core"
import { Settings, Edit } from "lucide-react-native"
import { UserProfileView } from "@features/profile/components/UserProfileView"
import { useThemeColors } from "@api/theme/useThemeColors"
import ThemedIcon from "@components/core/ThemedIcon"

/**
 * Profile screen
 *
 * @author AJ Kneisl
 */
export default function ProfileScreen() {
    const user = useUser()
    const profile = useProfile()
    const router = useRouter()
    const colors = useThemeColors()
    const queryClient = useQueryClient()
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["user"] }),
            queryClient.invalidateQueries({ queryKey: ["profile"] })
        ])
        setRefreshing(false)
    }, [queryClient])

    // Get the full user data to check TA status
    const { data: userData } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

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

            <ScrollView
                className="flex-1 px-6 py-4"
                contentContainerClassName="pb-24"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <UserProfileView
                    user={user}
                    profile={profile}
                    isTa={userData?.isTa}
                    actionButton={
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() =>
                                router.push("/settings/edit-profile")
                            }
                            leftIcon={
                                <ThemedIcon
                                    icon={Edit}
                                    regularColor="white"
                                    size={16}
                                />
                            }
                            className="mt-4"
                        >
                            Edit Profile
                        </Button>
                    }
                />
            </ScrollView>
        </SafeAreaView>
    )
}
