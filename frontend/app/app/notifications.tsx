import { useMemo, useCallback } from "react"
import { View, FlatList, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Bell, ChevronLeft } from "lucide-react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    useNotificationsQuery,
    useDeleteNotification,
    useToggleReadNotification,
    useClearAllNotifications
} from "@features/notifications/notifications.queries"
import {
    acceptInvite,
    declineInvite
} from "@features/burrows/attendees/attendees.api"
import ViewNotification from "@features/notifications/components/ViewNotification"
import { Header } from "@features/layout/components"
import { Button, Text } from "@components/core"
import Toast from "react-native-toast-message"
import type { Notification } from "@features/notifications/notifications.types"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * View the user's notifications.
 *
 * @author AJ Kneisl
 */
export default function NotificationsScreen() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
        useNotificationsQuery()

    const BackButton = (
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color={colors.text} />
        </Pressable>
    )

    const deleteMutation = useDeleteNotification()
    const toggleReadMutation = useToggleReadNotification()
    const clearAllMutation = useClearAllNotifications()

    // Flatten all notifications from pages
    const items = useMemo(() => {
        if (!data) return []

        return data.pages.flatMap((page) => {
            return page.contents
        })
    }, [data])

    // How many notifications are unread
    const unreadCount = useMemo(
        () => items.filter((i) => !i?.read).length,
        [items]
    )

    // Handle invite actions
    const acceptInviteMutation = useMutation({
        mutationFn: async ({
            burrowId,
            notificationId
        }: {
            burrowId: string
            notificationId: string
        }) => {
            await acceptInvite(burrowId)
            return notificationId
        },

        onSuccess: (notificationId) => {
            Toast.show({
                type: "success",
                text1: "Invite accepted!"
            })
            deleteMutation.mutate(notificationId)
            queryClient.invalidateQueries({ queryKey: ["notifications"] })
        },

        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to accept invite"
            })
        }
    })

    // Decline invite
    const declineInviteMutation = useMutation({
        mutationFn: async ({
            burrowId,
            notificationId
        }: {
            burrowId: string
            notificationId: string
        }) => {
            await declineInvite(burrowId)
            return notificationId
        },

        onSuccess: (notificationId) => {
            Toast.show({
                type: "success",
                text1: "Invite declined"
            })
            deleteMutation.mutate(notificationId)
            queryClient.invalidateQueries({ queryKey: ["notifications"] })
        },

        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to decline invite"
            })
        }
    })

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const renderNotification = ({ item }: { item: Notification }) => (
        <ViewNotification
            notification={item}
            clearOne={deleteMutation.mutate}
            toggleReadOne={toggleReadMutation.mutate}
            onAcceptInvite={acceptInviteMutation.mutate}
            onDeclineInvite={declineInviteMutation.mutate}
        />
    )

    const renderEmpty = () => (
        <View className="items-center justify-center py-12">
            <Bell size={48} color={colors.text} style={{ opacity: 0.2 }} />
            <Text className="text-text opacity-60 text-lg mt-4">
                No notifications
            </Text>
            <Text className="text-text opacity-50 text-sm mt-1">
                You&apos;re all caught up!
            </Text>
        </View>
    )

    const renderFooter = () => {
        if (!isFetchingNextPage) return null

        return (
            <View className="py-4">
                <Text className="text-text opacity-60 text-center text-sm">
                    Loading more...
                </Text>
            </View>
        )
    }

    const renderLoading = () => (
        <View className="px-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <View
                    key={i}
                    className="bg-card border border-card-border rounded-xl p-4"
                >
                    <View className="flex-row items-start gap-3">
                        <View className="flex-1 space-y-3">
                            <View className="bg-card-border h-5 w-48 rounded" />
                            <View className="bg-card-border h-4 w-full rounded" />
                            <View className="bg-card-border h-3 w-32 rounded" />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    )

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header
                title="Notifications"
                badge={unreadCount}
                showSearch={false}
                showNotifications={false}
                leftAction={BackButton}
                rightAction={
                    <Button
                        variant="danger"
                        size="sm"
                        onPress={() => clearAllMutation.mutate()}
                        disabled={items.length === 0}
                    >
                        Clear All
                    </Button>
                }
            />

            {/* Notifications list */}
            {isLoading ? (
                renderLoading()
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={
                        items.length === 0
                            ? { flex: 1 }
                            : { padding: 24, gap: 12 }
                    }
                />
            )}
        </SafeAreaView>
    )
}
