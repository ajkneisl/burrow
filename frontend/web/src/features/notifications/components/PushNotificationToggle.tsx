import { usePushNotifications } from "@features/notifications/hooks/usePushNotifications.tsx"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@umnburrow/core"

/**
 * Toggle component for enabling/disabling push notifications.
 *
 * This component allows users to subscribe or unsubscribe from browser push notifications.
 */
export function PushNotificationToggle() {
    const {
        isSupported,
        isSubscribed,
        permission,
        isLoading,
        subscribe,
        unsubscribe
    } = usePushNotifications()

    if (!isSupported) {
        return null
    }

    const handleToggle = () => {
        if (isSubscribed) {
            void unsubscribe()
        } else {
            void subscribe()
        }
    }

    const getButtonText = () => {
        if (isSubscribed) {
            return "Disable"
        }

        if (permission === "denied") {
            return "Blocked"
        }

        return "Enable"
    }

    const isDisabled = isLoading || permission === "denied"

    return (
        <div className="col-span-4 flex items-center justify-center">
            <div className="border-border flex w-full flex-col items-center justify-between gap-2 rounded-lg border p-4 md:w-1/2 md:flex-row">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                        {isSubscribed ? (
                            <Bell className="size-5 text-primary" />
                        ) : (
                            <BellOff className="text-muted-foreground size-5" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">
                            Browser Notifications
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            {isSubscribed
                                ? "You'll receive notifications in your browser"
                                : permission === "denied"
                                  ? "Please enable notifications in your browser settings"
                                  : "Get notified about important events"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-row gap-2">
                    <Button
                        onClick={handleToggle}
                        loading={isLoading}
                        disabled={isDisabled}
                        color={isSubscribed ? "ERROR" : "SUCCESS"}
                    >
                        {getButtonText()}
                    </Button>

                    {!isSubscribed && <Button color="ERROR">Never Ask</Button>}
                </div>
            </div>
        </div>
    )
}
