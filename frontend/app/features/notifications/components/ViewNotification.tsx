import { View, Text, Pressable } from "react-native"
import type { Notification } from "@features/notifications/notifications.types"
import { formatTimeAgo } from "@api/util"
import { Button } from "@components/core"

type ViewNotificationProps = {
    notification: Notification
    clearOne: (id: string) => void
    toggleReadOne: (id: string) => void
    onAcceptInvite?: (params: {
        burrowId: string
        notificationId: string
    }) => void
    onDeclineInvite?: (params: {
        burrowId: string
        notificationId: string
    }) => void
}

/**
 * View an individual notification (React Native).
 */
export default function ViewNotification({
    notification,
    clearOne,
    toggleReadOne,
    onAcceptInvite,
    onDeclineInvite
}: ViewNotificationProps) {
    const isInvite = notification.kind === "INVITE_RECEIVED"

    return (
        <View
            className={`rounded-xl border p-4 bg-background ${
                !notification?.read
                    ? "border-l-4 border-l-secondary border-t border-r border-b border-card-border"
                    : "border-card-border"
            }`}
        >
            <View className="flex-row items-start justify-between gap-3">
                {/* Header */}
                <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-semibold text-text flex-shrink">
                            {notification.title}
                        </Text>

                        {!notification.read && (
                            <View className="bg-secondary h-2 w-2 rounded-full" />
                        )}
                    </View>

                    <Text
                        className="text-sm text-text text-opacity-80 mt-1.5"
                        numberOfLines={2}
                    >
                        {notification.content}
                    </Text>

                    <Text className="text-xs text-text text-opacity-60 mt-2">
                        {formatTimeAgo(
                            notification.sentDate || notification.scheduledDate
                        )}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View className="flex-row items-center justify-end gap-2 mt-3">
                {/* Invite actions */}
                {isInvite &&
                    notification.burrowID &&
                    onAcceptInvite &&
                    onDeclineInvite && (
                        <>
                            <Button
                                variant="success"
                                size="sm"
                                onPress={() => {
                                    onAcceptInvite({
                                        burrowId: notification.burrowID!,
                                        notificationId: notification.id
                                    })
                                }}
                                className="flex-1"
                            >
                                Accept
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() =>
                                    onDeclineInvite({
                                        burrowId: notification.burrowID!,
                                        notificationId: notification.id
                                    })
                                }
                                className="flex-1"
                            >
                                Decline
                            </Button>
                        </>
                    )}

                {/* Mark as read when it's not an invite */}
                {!isInvite && !notification.read && (
                    <Button
                        variant="success"
                        size="sm"
                        onPress={() => toggleReadOne(notification.id)}
                    >
                        Mark as Read
                    </Button>
                )}

                {/* Clear */}
                <Button
                    variant="danger"
                    size="sm"
                    onPress={() => clearOne(notification.id)}
                >
                    Clear
                </Button>
            </View>
        </View>
    )
}
