import { followUser, getUserByUsername, unblockUser, unfollowUser } from "@umnburrow/core/api"
import { useCallback, useEffect, useState } from "react"
import { View, ScrollView, RefreshControl, ActivityIndicator, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"

import { Header } from "@features/layout/components"
import { Button, Modal, Text } from "@components/core"
import {
    UserPlus,
    UserMinus,
    ChevronLeft,
    EllipsisVertical,
    ShieldBan,
    ShieldOff,
    Flag
} from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import useUser from "@features/auth/hooks/useUser"
import { UserProfileView } from "@features/profile/components/UserProfileView"
import { BlockUserModal } from "@features/profile/components/BlockUserModal"
import { ReportUserModal } from "@features/profile/components/ReportUserModal"

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
    const currentUser = useUser()

    useEffect(() => {
        if (currentUser && username === currentUser.username) {
            router.replace("/(tabs)/profile")
        }
    }, [currentUser, username, router])

    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await queryClient.invalidateQueries({ queryKey: ["user", username] })
        setRefreshing(false)
    }, [queryClient, username])

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

    // unblock mutation
    const unblockMutation = useMutation({
        mutationFn: unblockUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["user", username]
            })
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

    // Menu/Block/Report modal state
    const [showMenu, setShowMenu] = useState(false)
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)

    const BackButton = (
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color={colors.text} />
        </Pressable>
    )

    const MenuButton = (
        <Pressable
            onPress={() => setShowMenu(true)}
            className="p-2 rounded-lg active:bg-card"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <EllipsisVertical size={24} color={colors.text} />
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

    const { user, profile, following, isBlocked } = data
    const isFollowing = following.youFollow
    const displayName = profile.name || user.username

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header
                title={`@${user.username}`}
                showSearch={false}
                showNotifications={false}
                leftAction={BackButton}
                rightAction={MenuButton}
            />

            {/* Action Sheet Menu */}
            <Modal
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                scrollable={false}
            >
                <View className="pb-2">
                    {isBlocked ? (
                        <Pressable
                            onPress={() => {
                                setShowMenu(false)
                                unblockMutation.mutate(user.id)
                            }}
                            className="flex-row items-center gap-4 py-4 active:opacity-70"
                        >
                            <ShieldOff size={22} color={colors.success} />
                            <Text className="text-text text-base">
                                Unblock User
                            </Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={() => {
                                setShowMenu(false)
                                setTimeout(() => setShowBlockModal(true), 300)
                            }}
                            className="flex-row items-center gap-4 py-4 active:opacity-70"
                        >
                            <ShieldBan size={22} color={colors.error} />
                            <Text className="text-text text-base">
                                Block User
                            </Text>
                        </Pressable>
                    )}

                    <View className="h-px bg-card-border" />

                    <Pressable
                        onPress={() => {
                            setShowMenu(false)
                            setTimeout(() => setShowReportModal(true), 300)
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <Flag size={22} color={colors.warn} />
                        <Text className="text-text text-base">Report User</Text>
                    </Pressable>

                    <View className="h-px bg-card-border mt-2" />

                    <Pressable
                        onPress={() => setShowMenu(false)}
                        className="py-4 active:opacity-70"
                    >
                        <Text className="text-text text-base text-center font-semibold">
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </Modal>

            {/* Block User Modal */}
            <BlockUserModal
                visible={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                userID={user.id}
                displayName={displayName}
            />

            {/* Report User Modal */}
            <ReportUserModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                userID={user.id}
                displayName={displayName}
            />

            <ScrollView
                className="flex-1 px-6 py-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Blocked Banner */}
                {isBlocked && (
                    <View
                        className="rounded-2xl p-4 mb-4 flex-row items-center gap-3"
                        style={{
                            backgroundColor: `${colors.error}15`,
                            borderWidth: 1,
                            borderColor: `${colors.error}30`
                        }}
                    >
                        <ShieldBan size={20} color={colors.error} />
                        <View className="flex-1">
                            <Text
                                className="font-semibold"
                                style={{ color: colors.error }}
                            >
                                You have blocked this user
                            </Text>
                            <Text className="text-text text-opacity-70 text-sm">
                                They cannot see your profile or contact you.
                            </Text>
                        </View>
                    </View>
                )}

                <UserProfileView
                    user={user}
                    profile={profile}
                    following={following}
                    hostedBurrows={data.recentHostedBurrows}
                    joinedBurrows={data.recentJoinedBurrows}
                    isTa={data.isTa}
                    actionButton={
                        isBlocked ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => unblockMutation.mutate(user.id)}
                                leftIcon={
                                    <ShieldOff size={16} color={colors.success} />
                                }
                                loading={unblockMutation.isPending}
                                className="mt-4"
                            >
                                Unblock
                            </Button>
                        ) : (
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
                        )
                    }
                />
            </ScrollView>
        </SafeAreaView>
    )
}
