import { Card, Toggle } from "@umnburrow/core"
import { settingsSaveLoading } from "@features/sync/settings/settings.atom.ts"
import toast from "react-hot-toast"
import { useAtom } from "jotai"
import { useState } from "react"
import clsx from "clsx"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Settings involving notifications.
 */
export default function NotificationSettings() {
    const [, setLoading] = useAtom(settingsSaveLoading)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [browserNotifications, setBrowserNotifications] = useState(false)
    const [upcomingMeetings, setUpcomingMeetings] = useState(true)
    const [newMeetings, setNewMeetings] = useState(true)
    const [meetingMessages, setMeetingMessages] = useState(true)
    const [invites, setInvites] = useState(true)
    const [leadTime, setLeadTime] = useState(30)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            // TODO: Call API to save notification preferences
            toast.success("Notification preferences updated")
        } catch (error) {
            toast.error("Failed to update notification preferences")
        } finally {
            setLoading(false)
        }
    }

    const handlePushNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            // Request notification permission
            if (!("Notification" in window)) {
                toast.error(
                    "Push notifications are not supported in this browser"
                )
                return
            }

            const permission = await Notification.requestPermission()
            if (permission !== "granted") {
                toast.error("Notification permission denied")
                return
            }

            // TODO: Subscribe to push notifications
            setBrowserNotifications(true)
            toast.success("Browser notifications enabled")
        } else {
            // TODO: Unsubscribe from push notifications
            setBrowserNotifications(false)
            toast.success("Browser notifications disabled")
        }
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
                {/* Master toggle */}
                <div className="bg-card-background border-card-border rounded-lg border px-4">
                    <Toggle
                        title="Enable Notifications"
                        checked={notificationsEnabled}
                        onChange={setNotificationsEnabled}
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
                            {/* Delivery Channels */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Delivery Channels
                                </h3>

                                <div className="w-full space-y-3">
                                    {/* Email notifications */}
                                    <div className="border-card-border rounded-lg border px-3">
                                        <Toggle
                                            title="Email"
                                            description="Receive notifications via email"
                                            checked={emailNotifications}
                                            onChange={setEmailNotifications}
                                        />
                                    </div>

                                    {/* Browser push notifications */}
                                    <div className="border-card-border rounded-lg border px-3">
                                        <Toggle
                                            title="Push Notifications"
                                            description="Receive notifications in your browser"
                                            checked={browserNotifications}
                                            onChange={handlePushNotificationToggle}
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
                                    {/* Upcoming meetings */}
                                    <div className="border-card-border w-full space-y-3 rounded-lg border px-3">
                                        <Toggle
                                            title="Upcoming Meetings"
                                            description="Reminders before your meetings start"
                                            checked={upcomingMeetings}
                                            onChange={setUpcomingMeetings}
                                        />

                                        <AnimatePresence initial={false}>
                                            {upcomingMeetings && (
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        height: 0
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        height: "auto"
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        height: 0
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="w-full overflow-hidden pb-4"
                                                >
                                                    <label className="mb-2 block text-sm font-medium">
                                                        Reminder time (minutes
                                                        before)
                                                    </label>
                                                    <select
                                                        value={leadTime}
                                                        onChange={(e) =>
                                                            setLeadTime(
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className={clsx(
                                                            "border-card-border block w-full rounded-lg border",
                                                            "bg-card-background px-3 py-2",
                                                            "focus:border-hero-color focus:ring-hero-color/20 focus:ring-2"
                                                        )}
                                                    >
                                                        <option value={5}>
                                                            5 minutes
                                                        </option>
                                                        <option value={10}>
                                                            10 minutes
                                                        </option>
                                                        <option value={15}>
                                                            15 minutes
                                                        </option>
                                                        <option value={30}>
                                                            30 minutes
                                                        </option>
                                                        <option value={60}>
                                                            1 hour
                                                        </option>
                                                        <option value={120}>
                                                            2 hours
                                                        </option>
                                                    </select>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* New meetings */}
                                    <div className="border-card-border rounded-lg border px-3">
                                        <Toggle
                                            title="New Meetings"
                                            description="When someone creates a new meeting"
                                            checked={newMeetings}
                                            onChange={setNewMeetings}
                                        />
                                    </div>

                                    {/* Meeting messages */}
                                    <div className="border-card-border rounded-lg border px-3">
                                        <Toggle
                                            title="Meeting Messages"
                                            description="When someone posts in a meeting"
                                            checked={meetingMessages}
                                            onChange={setMeetingMessages}
                                        />
                                    </div>

                                    {/* Invites */}
                                    <div className="border-card-border rounded-lg border px-3">
                                        <Toggle
                                            title="Invites"
                                            description="When you receive meeting invites"
                                            checked={invites}
                                            onChange={setInvites}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </Card>
    )
}
