import { BROWSER_CHANNEL, EMAIL_CHANNEL, disableChannel, enableChannel, isChannelEnabled } from "@umnburrow/core/api"
import type { NotificationPreferences } from "@umnburrow/core/api"
import { SelectInput, Toggle } from "@umnburrow/core"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
/**
 * @see NotificationKindSettings
 */
type NotificationKindSettingsProps = {
    title: string
    description: string
    preferences: NotificationPreferences
    onChange: (
        preferences: (
            previous: NotificationPreferences
        ) => NotificationPreferences
    ) => void
    emailEnabled: boolean
    browserEnabled: boolean
}

/**
 * Settings for a specific notification type with channel selection.
 *
 * @param title The name of the notification kind.
 * @param description The description of the notification kind.
 * @param preferences The preferences on this kind of notification.
 * @param onChange When this notification kind is changed.
 * @param emailEnabled If the global email notifications are enabled.
 * @param browserEnabled If the global browser notifications are enabled.
 *
 * @author AJ Kneisl
 */
export default function NotificationKindSettings({
    title,
    description,
    preferences,
    onChange,
    emailEnabled,
    browserEnabled
}: NotificationKindSettingsProps) {
    const hasEmailChannel = isChannelEnabled(
        preferences.deliveryChannels,
        EMAIL_CHANNEL
    )

    const hasBrowserChannel = isChannelEnabled(
        preferences.deliveryChannels,
        BROWSER_CHANNEL
    )

    const toggleChannel = (channel: number) => {
        onChange((prev) => {
            return {
                ...prev,
                deliveryChannels: hasEmailChannel
                    ? disableChannel(prev.deliveryChannels, channel)
                    : enableChannel(prev.deliveryChannels, channel)
            }
        })
    }

    const updateLeadMinutes = (minutes: number) => {
        onChange(() => ({
            ...preferences,
            leadMinutes: minutes
        }))
    }

    const updateThrottleMinutes = (minutes: number) => {
        onChange(() => ({
            ...preferences,
            throttleMinutes: minutes
        }))
    }

    return (
        <div
            className="w-full space-y-3
         rounded-lg border border-card-border bg-background px-3"
        >
            {/* main toggle for the certain kind */}
            <Toggle
                title={title}
                description={description}
                checked={preferences.enabled}
                onChange={(enabled) =>
                    onChange((prev) => ({ ...prev, enabled }))
                }
            />

            <div className="overflow-hidden">
                <AnimatePresence initial={false}>
                    {preferences.enabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                                height: "auto",
                                opacity: 1,
                                transition: {
                                    height: {
                                        duration: 0.3,
                                        ease: [0.4, 0.0, 0.2, 1]
                                    },
                                    opacity: {
                                        duration: 0.2,
                                        delay: 0.1
                                    }
                                }
                            }}
                            exit={{
                                height: 0,
                                opacity: 0,
                                transition: {
                                    height: {
                                        duration: 0.3,
                                        ease: [0.4, 0.0, 0.2, 1]
                                    },
                                    opacity: {
                                        duration: 0.15
                                    }
                                }
                            }}
                        >
                            <div className="w-full space-y-3 pb-4">
                                {/* channel selection */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">
                                        Delivery Channels
                                    </p>

                                    <div className="flex gap-4">
                                        {/* email notifications */}
                                        <label
                                            className={clsx(
                                                "flex cursor-pointer items-center gap-2",
                                                !emailEnabled &&
                                                    "cursor-not-allowed"
                                            )}
                                        >
                                            <Toggle
                                                checked={
                                                    hasEmailChannel &&
                                                    emailEnabled
                                                }
                                                onChange={() =>
                                                    toggleChannel(EMAIL_CHANNEL)
                                                }
                                                size="small"
                                                variant="standalone"
                                                disabled={!emailEnabled}
                                            />

                                            <span
                                                className={clsx(
                                                    "text-sm",
                                                    !emailEnabled &&
                                                        "opacity-50"
                                                )}
                                            >
                                                Email
                                            </span>
                                        </label>

                                        {/* browser notifications */}
                                        <label
                                            className={clsx(
                                                "flex cursor-pointer items-center gap-2",
                                                !browserEnabled &&
                                                    "cursor-not-allowed"
                                            )}
                                        >
                                            <Toggle
                                                checked={
                                                    hasBrowserChannel &&
                                                    browserEnabled
                                                }
                                                onChange={() =>
                                                    toggleChannel(
                                                        BROWSER_CHANNEL
                                                    )
                                                }
                                                size="small"
                                                variant="standalone"
                                                disabled={!browserEnabled}
                                            />

                                            <span
                                                className={clsx(
                                                    "text-sm",
                                                    !browserEnabled &&
                                                        "opacity-50"
                                                )}
                                            >
                                                Push
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* upcoming meetings have a lead time */}
                                {preferences.kind === "UPCOMING_MEETING" && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">
                                            Reminder time (minutes before)
                                        </label>

                                        <SelectInput
                                            value={preferences.leadMinutes}
                                            onChange={(e) =>
                                                updateLeadMinutes(
                                                    Number(e.target.value)
                                                )
                                            }
                                            items={[
                                                "5 minutes",
                                                "10 minutes",
                                                "15 minutes",
                                                "30 minutes",
                                                "1 hour",
                                                "2 hours"
                                            ]}
                                        />
                                    </div>
                                )}

                                {/* meeting messages can have a throttle time */}
                                {preferences.kind === "MEETING_MESSAGE" && (
                                    <div>
                                        <label className="block text-sm font-medium">
                                            Throttle notifications
                                        </label>

                                        <p className="mb-2 text-xs opacity-70">
                                            How long after the last message to
                                            send a notification on another.
                                        </p>

                                        <SelectInput
                                            value={preferences.throttleMinutes}
                                            onChange={(e) =>
                                                updateThrottleMinutes(
                                                    Number(e.target.value)
                                                )
                                            }
                                            items={[
                                                "5 minutes",
                                                "10 minutes",
                                                "15 minutes",
                                                "30 minutes",
                                                "1 hour"
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
