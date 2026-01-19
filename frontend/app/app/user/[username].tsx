import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Pressable
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import {
    getUserByUsername,
    followUser,
    unfollowUser
} from "@features/auth/user.api"
import { Header } from "@features/layout/components"
import { Button } from "@components/core"
import { UserPlus, UserMinus, ChevronLeft } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { UserProfileView } from "@features/profile/components/UserProfileView"

/**
 * User profile screen
 *
 * @author AJ Kneisl
 */
export default function UserProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const { data, isLoading, error } = useQuery({
        queryKey: ["user", username],
        queryFn: () => getUserByUsername(username!),
        enabled: !!username
    })

    // follow mutation
    const followMutation = useMutation({
        mutationFn: followUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["user", username]
            })
            await queryClient.invalidateQueries({ queryKey: ["relations"] })

            Toast.show({
                type: "success",
                text1: "Followed successfully"
            })
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to follow",
                text2: error.message || "Please try again"
            })
        }
    })

    // unfollow mutation
    const unfollowMutation = useMutation({
        mutationFn: unfollowUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["user", username]
            })
            await queryClient.invalidateQueries({ queryKey: ["relations"] })
            Toast.show({
                type: "success",
                text1: "Unfollowed successfully"
            })
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to unfollow",
                text2: error.message || "Please try again"
            })
        }
    })

    const BackButton = (
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color={colors.text} />
        </Pressable>
    )

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
                <Header
                    title="Profile"
                    showSearch={false}
                    showNotifications={false}
                    leftAction={BackButton}
                />

                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text opacity-60 mt-4">
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error || !data) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
                <Header
                    title="Profile"
                    showSearch={false}
                    showNotifications={false}
                    leftAction={BackButton}
                />
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-text opacity-60 text-lg">
                        User not found
                    </Text>

                    <Text className="text-text opacity-50 text-sm mt-2">
                        This user doesn&apos;t exist or their profile is private
                    </Text>

                    <Button
                        variant="primary"
                        onPress={() => router.back()}
                        className="mt-6"
                    >
                        Go Back
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    const { user, profile, following } = data
    const isFollowing = following.youFollow

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header
                title={`@${user.username}`}
                showSearch={false}
                showNotifications={false}
                leftAction={BackButton}
            />

            <ScrollView className="flex-1 px-6 py-4">
                <UserProfileView
                    user={user}
                    profile={profile}
                    following={following}
                    recentBurrows={data.recentHostedBurrows}
                    isTa={data.isTa}
                    actionButton={
                        <Button
                            variant={isFollowing ? "outline" : "primary"}
                            size="sm"
                            onPress={() => {
                                if (isFollowing) {
                                    unfollowMutation.mutate(user.id)
                                } else {
                                    followMutation.mutate(user.id)
                                }
                            }}
                            leftIcon={
                                isFollowing ? (
                                    <UserMinus
                                        size={16}
                                        color={colors.primary}
                                    />
                                ) : (
                                    <UserPlus size={16} color="#FFFFFF" />
                                )
                            }
                            loading={
                                followMutation.isPending ||
                                unfollowMutation.isPending
                            }
                            className="mt-4"
                        >
                            {isFollowing ? "Unfollow" : "Follow"}
                        </Button>
                    }
                />
            </ScrollView>
        </SafeAreaView>
    )
}
