import { View, Switch, ActivityIndicator } from "react-native"
import { Card, Text } from "@components/core"
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
import clsx from "clsx"

const NOTIFICATION_LABELS: Record<NotificationKind, { title: string; description: string }> = {
    [NotificationKind.UPCOMING_MEETING]: {
        title: "Upcoming Burrows",
        description: "Reminders before burrows you've joined"
    },
    [NotificationKind.NEW_MEETING]: {
        title: "New Burrows",
        description: "When new burrows are created near you"
    },
    [NotificationKind.MEETING_MESSAGE]: {
        title: "Burrow Messages",
        description: "Messages in burrows you're part of"
    },
    [NotificationKind.INVITE_RECEIVED]: {
        title: "Invites Received",
        description: "When someone invites you to a burrow"
    },
    [NotificationKind.NEWSLETTER]: {
        title: "Newsletter",
        description: "Weekly updates and highlights"
    },
    [NotificationKind.RECOMMENDED]: {
        title: "Recommendations",
        description: "Suggested burrows based on your interests"
    }
}

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

    useEffect(() => {
        if (preferences) {
            setLocalPreferences(preferences)
        }
    }, [preferences])

    const savePreferences = (prefs: NotificationPreferences[]) => {
        saveMutation.mutate(prefs, {
            onError: () => {
                Toast.show({
                    type: "error",
                    text1: "Failed to save preferences",
                    text2: "Your changes were not saved"
                })
                setLocalPreferences(preferences)
            }
        })
    }

    const handleToggleEnabled = (
        kind: NotificationKind,
        currentChannels: number
    ) => {
        if (!localPreferences) return

        const updated = localPreferences.map((pref) => {
            if (pref.kind !== kind) return pref

            const defaultChannel = isMobileEnabled
                ? MOBILE_CHANNEL
                : EMAIL_CHANNEL

            return {
                ...pref,
                deliveryChannels: currentChannels === 0 ? defaultChannel : 0
            }
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
            if (pref.kind !== kind) return pref

            return {
                ...pref,
                deliveryChannels: isChannelEnabled(currentChannels, channel)
                    ? disableChannel(currentChannels, channel)
                    : enableChannel(currentChannels, channel)
            }
        })

        setLocalPreferences(updated)
        savePreferences(updated)
    }

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center py-16">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-text opacity-50 mt-4 text-sm">
                    Loading preferences...
                </Text>
            </View>
        )
    }

    if (isError || !localPreferences) {
        return (
            <Card variant="bordered" style={{ backgroundColor: `${colors.error}15` }}>
                <View className="flex-row items-start gap-3 p-1">
                    <ThemedIcon
                        icon={AlertCircle}
                        size={20}
                        overrideColor="error"
                    />
                    <View className="flex-1">
                        <Text className="text-error font-semibold mb-1">
                            Failed to load preferences
                        </Text>
                        <Text className="text-text opacity-50 text-sm">
                            Please try again later
                        </Text>
                    </View>
                </View>
            </Card>
        )
    }

    return (
        <View className="gap-5">
            {localPreferences.map((pref) => {
                const isEnabled = pref.deliveryChannels > 0
                const hasMobile = isChannelEnabled(pref.deliveryChannels, MOBILE_CHANNEL)
                const hasEmail = isChannelEnabled(pref.deliveryChannels, EMAIL_CHANNEL)
                const info = NOTIFICATION_LABELS[pref.kind]

                return (
                    <Card
                        key={pref.kind}
                        variant="bordered"
                        className={clsx(
                            isEnabled && "border-primary/20"
                        )}
                    >
                        {/* Main Toggle */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1 mr-4">
                                <Text className="text-text font-semibold text-base">
                                    {info.title}
                                </Text>
                                <Text className="text-text opacity-50 text-xs mt-0.5">
                                    {info.description}
                                </Text>
                            </View>

                            <Switch
                                value={isEnabled}
                                onValueChange={() =>
                                    handleToggleEnabled(pref.kind, pref.deliveryChannels)
                                }
                                trackColor={{
                                    false: colors.card,
                                    true: colors.primary
                                }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        {/* Delivery Methods */}
                        {isEnabled && (
                            <View className="mt-4 pt-4 border-t border-card-border gap-3">
                                <Text className="text-text opacity-40 text-[10px] font-semibold uppercase tracking-wider">
                                    Delivery Methods
                                </Text>

                                {/* Mobile */}
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <ThemedIcon
                                            icon={Smartphone}
                                            size={16}
                                            opacity={isMobileEnabled ? 0.7 : 0.3}
                                        />
                                        <View>
                                            <Text
                                                className={clsx(
                                                    "text-sm text-text",
                                                    isMobileEnabled ? "opacity-80" : "opacity-40"
                                                )}
                                            >
                                                Mobile
                                            </Text>
                                            {!isMobileEnabled && (
                                                <Text className="text-text opacity-30 text-[11px] mt-0.5">
                                                    Enable push notifications first
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

                                {/* Email */}
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <ThemedIcon
                                            icon={Mail}
                                            size={16}
                                            opacity={0.7}
                                        />
                                        <Text className="text-text opacity-80 text-sm">
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

            <Text className="text-text opacity-30 text-xs text-center mt-2">
                Changes are saved automatically
            </Text>
        </View>
    )
}
