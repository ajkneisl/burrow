import { View, Text, Switch, ActivityIndicator } from "react-native"
import { Card } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    useNotificationPreferences,
    useSaveNotificationPreferences
} from "@features/settings/settings.queries"
import {
    isChannelEnabled,
    enableChannel,
    disableChannel
} from "@features/settings/settings.api"
import {
    MOBILE_CHANNEL,
    EMAIL_CHANNEL,
    NotificationKind,
    type NotificationPreferences
} from "@features/settings/settings.types"
import { Mail, Smartphone, AlertCircle } from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"
import { useState, useEffect } from "react"
import Toast from "react-native-toast-message"
import { usePushNotifications } from "@features/notifications/hooks/usePushNotifications"
import clsx from "clsx";

/**
 * Notification preferences component.
 * Allows users to manage notification types and delivery channels.
 *
 * @author AJ Kneisl
 */
export function NotificationPreferencesComponent() {
    const colors = useThemeColors()
    const { isSubscribed: isMobileEnabled } = usePushNotifications()

    const {
        data: preferences,
        isLoading,
        isError
    } = useNotificationPreferences()
    const saveMutation = useSaveNotificationPreferences()

    const [localPreferences, setLocalPreferences] = useState<
        NotificationPreferences[] | undefined
    >(preferences)

    // sync frontend with fetched data
    useEffect(() => {
        if (preferences) {
            setLocalPreferences(preferences)
        }
    }, [preferences])

    const handleToggleEnabled = (
        kind: NotificationKind,
        currentChannels: number
    ) => {
        if (!localPreferences) return

        const updated = localPreferences.map((pref) => {
            if (pref.kind === kind) {
                const defaultChannel = isMobileEnabled
                    ? MOBILE_CHANNEL
                    : EMAIL_CHANNEL
                const newChannels = currentChannels === 0 ? defaultChannel : 0

                return {
                    ...pref,
                    deliveryChannels: newChannels
                }
            }
            return pref
        })

        setLocalPreferences(updated)
        savePreferences(updated)
    }

    const handleToggleChannel = (
        kind: NotificationKind,
        currentChannels: number,
        channel: number
    ) => {
        if (!localPreferences) return

        const updated = localPreferences.map((pref) => {
            if (pref.kind === kind) {
                const newChannels = isChannelEnabled(currentChannels, channel)
                    ? disableChannel(currentChannels, channel)
                    : enableChannel(currentChannels, channel)

                return {
                    ...pref,
                    deliveryChannels: newChannels
                }
            }
            return pref
        })

        setLocalPreferences(updated)
        savePreferences(updated)
    }

    // save preferences
    const savePreferences = (prefs: NotificationPreferences[]) => {
        saveMutation.mutate(prefs, {
            onError: () => {
                Toast.show({
                    type: "error",
                    text1: "Failed to save preferences",
                    text2: "Your changes were not saved"
                })

                // Revert to server state
                setLocalPreferences(preferences)
            }
        })
    }

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-text text-opacity-60 mt-4">
                    Loading preferences...
                </Text>
            </View>
        )
    }

    if (isError || !localPreferences) {
        return (
            <Card variant="bordered" className="bg-error bg-opacity-5">
                <View className="flex-row items-start gap-3">
                    <ThemedIcon
                        icon={AlertCircle}
                        size={20}
                        overrideColor="error"
                    />
                    <View className="flex-1">
                        <Text className="text-error font-semibold mb-1">
                            Failed to load preferences
                        </Text>
                        <Text className="text-text text-opacity-60 text-sm">
                            Please try again later
                        </Text>
                    </View>
                </View>
            </Card>
        )
    }

    const notificationKindLabels: Record<NotificationKind, string> = {
        [NotificationKind.UPCOMING_MEETING]: "Upcoming Burrows",
        [NotificationKind.NEW_MEETING]: "New Burrows",
        [NotificationKind.MEETING_MESSAGE]: "Burrow Messages",
        [NotificationKind.INVITE_RECEIVED]: "Invites Received",
        [NotificationKind.NEWSLETTER]: "Newsletter",
        [NotificationKind.RECOMMENDED]: "Recommendations"
    }

    return (
        <View className="space-y-4 gap-4">
            {localPreferences.map((pref) => {
                const isEnabled = pref.deliveryChannels > 0
                const hasMobile = isChannelEnabled(
                    pref.deliveryChannels,
                    MOBILE_CHANNEL
                )
                const hasEmail = isChannelEnabled(
                    pref.deliveryChannels,
                    EMAIL_CHANNEL
                )

                return (
                    <Card
                        key={pref.kind}
                        variant="bordered"
                        className={
                            isEnabled ? "border-primary border-opacity-20" : ""
                        }
                    >
                        {/* Main Toggle */}
                        <View
                            className={clsx(
                                "flex-row items-center justify-between",
                                isEnabled && "mb-3"
                            )}
                        >
                            <Text className="text-text font-semibold flex-1">
                                {notificationKindLabels[pref.kind]}
                            </Text>

                            <Switch
                                value={isEnabled}
                                onValueChange={() =>
                                    handleToggleEnabled(
                                        pref.kind,
                                        pref.deliveryChannels
                                    )
                                }
                                trackColor={{
                                    false: colors.card,
                                    true: colors.primary
                                }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        {/* delivery methods */}
                        {isEnabled && (
                            <View className="space-y-2 gap-2 pt-3 border-t border-card-border">
                                <Text className="text-text text-opacity-60 text-xs font-semibold uppercase mb-1">
                                    Delivery Methods
                                </Text>

                                {/* mobile */}
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-2 flex-1">
                                        <ThemedIcon
                                            icon={Smartphone}
                                            size={16}
                                            opacity={
                                                isMobileEnabled ? 0.8 : 0.6
                                            }
                                        />

                                        <View>
                                            <Text
                                                className={`text-sm ${isMobileEnabled ? "text-text text-opacity-80" : "text-text text-opacity-40"}`}
                                            >
                                                Mobile
                                            </Text>

                                            {!isMobileEnabled && (
                                                <Text className="text-xs text-text text-opacity-40">
                                                    You do not have mobile
                                                    notifications enabled!
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    <Switch
                                        value={hasMobile && isMobileEnabled}
                                        onValueChange={() =>
                                            handleToggleChannel(
                                                pref.kind,
                                                pref.deliveryChannels,
                                                MOBILE_CHANNEL
                                            )
                                        }
                                        trackColor={{
                                            false: colors.card,
                                            true: colors.success
                                        }}
                                        thumbColor="#FFFFFF"
                                        disabled={!isMobileEnabled}
                                    />
                                </View>

                                {/* Email Channel */}
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-2 flex-1">
                                        <ThemedIcon
                                            icon={Mail}
                                            size={16}
                                            opacity={0.8}
                                        />

                                        <Text className="text-text text-opacity-80 text-sm">
                                            Email
                                        </Text>
                                    </View>
                                    <Switch
                                        value={hasEmail}
                                        onValueChange={() =>
                                            handleToggleChannel(
                                                pref.kind,
                                                pref.deliveryChannels,
                                                EMAIL_CHANNEL
                                            )
                                        }
                                        trackColor={{
                                            false: colors.card,
                                            true: colors.success
                                        }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>
                            </View>
                        )}
                    </Card>
                )
            })}

            {/* Footer Note */}
            <View className="px-4 py-3">
                <Text className="text-text text-opacity-40 text-xs text-center">
                    Changes are saved automatically
                </Text>
            </View>
        </View>
    )
}
