import { Card, Toggle } from "@umnburrow/core"
import { settingsSaveLoading } from "@features/settings/settings.atom.ts"
import toast from "react-hot-toast"
import { useAtom } from "jotai"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    BROWSER_CHANNEL,
    EMAIL_CHANNEL,
    EMPTY_NOTIFICATION_PREFERENCES,
    type NotificationPreferences
} from "@features/settings/settings.types.ts"
import NotificationKindSettings from "./NotificationKindSettings.tsx"
import {
    getGeneralSettings,
    getNotificationPreferences,
    isChannelEnabled,
    saveGeneralSettings,
    saveNotificationPreferences
} from "@features/settings/settings.api.ts"
import type { NotificationKind } from "@features/notifications/notifications.types.ts"
import type { FormEvent } from "react"
import { usePushNotifications } from "@features/notifications/hooks/usePushNotifications.tsx"

/**
 * Settings involving notifications.
 *
 * @author AJ Kneisl
 */
export default function NotificationsSection() {
    const [, setLoading] = useAtom(settingsSaveLoading)
    const queryClient = useQueryClient()

    const { isSupported, subscribe, unsubscribe } = usePushNotifications()

    // general settings query
    const { data: generalSettings } = useQuery({
        queryKey: ["settings", "general"],
        queryFn: getGeneralSettings
    })

    const saveGeneralMutation = useMutation({
        mutationFn: saveGeneralSettings,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["settings", "general"]
            })
        }
    })

    // notification settings query
    const { data: notificationPreferences } = useQuery({
        queryKey: ["settings", "notifications"],
        queryFn: getNotificationPreferences
    })

    const savePreferencesMutation = useMutation({
        mutationFn: saveNotificationPreferences,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["settings", "notifications"]
            })
        }
    })

    // get a preference by its kind
    function getPreference(kind: NotificationKind) {
        return (
            notificationPreferences?.find((pref) => pref.kind === kind) ?? {
                ...EMPTY_NOTIFICATION_PREFERENCES,
                kind,
                leadMinutes: kind === "UPCOMING_MEETING" ? 30 : 0
            }
        )
    }

    const notificationsEnabled = generalSettings?.notificationsEnabled ?? true
    const emailNotifications = isChannelEnabled(
        generalSettings?.defaultNotificationDelivery ?? 0b0111,
        EMAIL_CHANNEL
    )
    const browserNotifications = isChannelEnabled(
        generalSettings?.defaultNotificationDelivery ?? 0b0111,
        BROWSER_CHANNEL
    )

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            let deliveryChannels = 0

            if (emailNotifications) deliveryChannels |= EMAIL_CHANNEL
            if (browserNotifications) deliveryChannels |= BROWSER_CHANNEL

            // save general
            await saveGeneralMutation.mutateAsync({
                notificationsEnabled,
                defaultNotificationDelivery: deliveryChannels
            })

            // save preferences
            await savePreferencesMutation.mutateAsync([
                getPreference("UPCOMING_MEETING"),
                getPreference("NEW_MEETING"),
                getPreference("MEETING_MESSAGE"),
                getPreference("INVITE_RECEIVED"),
                getPreference("NEWSLETTER"),
                getPreference("RECOMMENDED")
            ])

            toast.success("Settings saved successfully")
        } catch (error) {
            console.error("Failed to save settings:", error)
            toast.error("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    // update general settings
    const updateGeneralSettings = (
        updates: Partial<{
            notificationsEnabled: boolean
            defaultNotificationDelivery: number
        }>
    ) => {
        queryClient.setQueryData(
            ["settings", "general"],
            (
                old:
                    | {
                          notificationsEnabled: boolean
                          defaultNotificationDelivery: number
                      }
                    | undefined
            ) => ({
                notificationsEnabled: true,
                defaultNotificationDelivery: 0b0111,
                ...old,
                ...updates
            })
        )
    }

    const createPreferenceUpdater =
        (kind: NotificationPreferences["kind"]) =>
        (
            updater: (prev: NotificationPreferences) => NotificationPreferences
        ) => {
            queryClient.setQueryData(
                ["settings", "notifications"],
                (old: NotificationPreferences[] = []) => {
                    const currentPref = old.find((p) => p.kind === kind) ?? {
                        ...EMPTY_NOTIFICATION_PREFERENCES,
                        kind,
                        leadMinutes: kind === "UPCOMING_MEETING" ? 30 : 0
                    }

                    const updated = updater(currentPref)
                    const index = old.findIndex((p) => p.kind === kind)

                    if (index >= 0) {
                        const newPrefs = [...old]
                        newPrefs[index] = updated
                        return newPrefs
                    }
                    return [...old, updated]
                }
            )
        }

    const handlePushNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            if (!isSupported) {
                toast.error(
                    "Push notifications are not supported in this browser"
                )
                return
            }

            await subscribe()

            const current = generalSettings?.defaultNotificationDelivery ?? 0
            updateGeneralSettings({
                defaultNotificationDelivery: current | BROWSER_CHANNEL
            })
        } else {
            await unsubscribe()

            const current = generalSettings?.defaultNotificationDelivery ?? 0

            updateGeneralSettings({
                defaultNotificationDelivery: current & ~BROWSER_CHANNEL
            })
        }
    }

    const handleEmailToggle = (enabled: boolean) => {
        const current = generalSettings?.defaultNotificationDelivery ?? 0
        updateGeneralSettings({
            defaultNotificationDelivery: enabled
                ? current | EMAIL_CHANNEL
                : current & ~EMAIL_CHANNEL
        })
    }

    const handleNotificationsEnabledToggle = (enabled: boolean) => {
        updateGeneralSettings({ notificationsEnabled: enabled })
    }

    return (
        <Card className="flex flex-col gap-6">
            <div>
                <h2 className="mb-2 text-xl font-semibold">
                    Notification Preferences
                </h2>

                <p className="text-sm opacity-70">
                    Manage how and when you receive notifications.
                </p>
            </div>

            <form
                id="notifications-form"
                onSubmit={onSubmit}
                className="space-y-6"
            >
                {/* overall toggle */}
                <div className="bg-background/80 border-background rounded-lg px-3">
                    <Toggle
                        title="Enable Notifications"
                        checked={notificationsEnabled}
                        onChange={handleNotificationsEnabledToggle}
                    />
                </div>

                <AnimatePresence initial={false}>
                    {notificationsEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full space-y-6 overflow-hidden"
                        >
                            {/* overall channels */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Delivery Channels
                                </h3>

                                <div className="w-full space-y-3">
                                    <div className="bg-background/80 border-background rounded-lg px-3">
                                        <Toggle
                                            title="Email"
                                            description="Receive notifications via email"
                                            checked={emailNotifications}
                                            onChange={handleEmailToggle}
                                        />
                                    </div>

                                    <div className="bg-background/80 border-background rounded-lg px-3">
                                        <Toggle
                                            title="Push Notifications"
                                            description={
                                                "Receive notifications in your browser" +
                                                (!isSupported
                                                    ? " (this is not supported by your browser)"
                                                    : "")
                                            }
                                            checked={browserNotifications}
                                            onChange={
                                                handlePushNotificationToggle
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notification Types */}
                            <div className="w-full space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Notification Types
                                </h3>

                                <div className="w-full space-y-3">
                                    <NotificationKindSettings
                                        title="Upcoming Meetings"
                                        description="Reminders before your meetings start"
                                        preferences={getPreference(
                                            "UPCOMING_MEETING"
                                        )}
                                        onChange={createPreferenceUpdater(
                                            "UPCOMING_MEETING"
                                        )}
                                        emailEnabled={emailNotifications}
                                        browserEnabled={browserNotifications}
                                    />

                                    <NotificationKindSettings
                                        title="New Meetings"
                                        description="When someone creates a new meeting"
                                        preferences={getPreference(
                                            "NEW_MEETING"
                                        )}
                                        onChange={createPreferenceUpdater(
                                            "NEW_MEETING"
                                        )}
                                        emailEnabled={emailNotifications}
                                        browserEnabled={browserNotifications}
                                    />

                                    <NotificationKindSettings
                                        title="Meeting Messages"
                                        description="When someone posts in a meeting"
                                        preferences={getPreference(
                                            "MEETING_MESSAGE"
                                        )}
                                        onChange={createPreferenceUpdater(
                                            "MEETING_MESSAGE"
                                        )}
                                        emailEnabled={emailNotifications}
                                        browserEnabled={browserNotifications}
                                    />

                                    <NotificationKindSettings
                                        title="Invites"
                                        description="When you receive meeting invites"
                                        preferences={getPreference(
                                            "INVITE_RECEIVED"
                                        )}
                                        onChange={createPreferenceUpdater(
                                            "INVITE_RECEIVED"
                                        )}
                                        emailEnabled={emailNotifications}
                                        browserEnabled={browserNotifications}
                                    />

                                    <NotificationKindSettings
                                        title="Newsletter"
                                        description="Periodic updates about Burrow features and news"
                                        preferences={getPreference(
                                            "NEWSLETTER"
                                        )}
                                        onChange={createPreferenceUpdater(
                                            "NEWSLETTER"
                                        )}
                                        emailEnabled={emailNotifications}
                                        browserEnabled={browserNotifications}
                                    />

                                    <NotificationKindSettings
                                        title="Recommended Meetings and Users"
                                        description="Suggestions for meetings and users you might be interested in"
                                        preferences={getPreference(
                                            "RECOMMENDED"
                                        )}
                                        onChange={createPreferenceUpdater(
                                            "RECOMMENDED"
                                        )}
                                        emailEnabled={emailNotifications}
                                        browserEnabled={browserNotifications}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </Card>
    )
}
