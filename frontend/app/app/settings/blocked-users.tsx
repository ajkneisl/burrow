import { getBlockedUsers, unblockUser } from "@umnburrow/core/api"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { ArrowLeft, ShieldOff, UserCircle } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

import { Button, Text } from "@components/core"

/**
 * Blocked users settings screen.
 */
export default function BlockedUsersScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const { data: blockedUsers, isLoading } = useQuery({
        queryKey: ["blockedUsers"],
        queryFn: getBlockedUsers
    })

    const unblockMutation = useMutation({
        mutationFn: unblockUser,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["blockedUsers"] })
            Toast.show({
                type: "success",
                text1: "User unblocked"
            })
        },
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to unblock",
                text2: error.message || "Please try again"
            })
        }
    })

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
                        Blocked Users
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        Manage users you&apos;ve blocked
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {isLoading ? (
                    <View className="items-center justify-center py-12">
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : !blockedUsers || blockedUsers.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <ShieldOff size={48} color={colors.text} style={{ opacity: 0.6 }} />
                        <Text className="text-text text-opacity-60 text-center mt-4">
                            You haven&apos;t blocked anyone
                        </Text>
                        <Text className="text-text text-opacity-40 text-center text-sm mt-2">
                            Blocked users won&apos;t be able to see your profile or contact you
                        </Text>
                    </View>
                ) : (
                    <View className="gap-3">
                        {blockedUsers.map((user) => (
                            <View
                                key={user.userID}
                                className="bg-card rounded-2xl p-4 border border-card-border"
                            >
                                <Pressable
                                    onPress={() => router.push(`/user/${user.username}`)}
                                    className="flex-row items-center flex-1"
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: `${colors.primary}20` }}
                                    >
                                        <UserCircle size={28} color={colors.primary} />
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-text font-semibold text-base">
                                            {user.name}
                                        </Text>
                                        <Text className="text-text text-opacity-60 text-sm">
                                            @{user.username}
                                        </Text>
                                    </View>
                                </Pressable>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => unblockMutation.mutate(user.userID)}
                                    loading={unblockMutation.isPending}
                                    leftIcon={<ShieldOff size={16} color={colors.success} />}
                                    className="mt-3"
                                >
                                    Unblock
                                </Button>
                            </View>
                        ))}
                    </View>
                )}

                {/* Bottom Spacer */}
                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}
