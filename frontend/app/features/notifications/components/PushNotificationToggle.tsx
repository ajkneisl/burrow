import { View, Text, Switch, ActivityIndicator } from "react-native"
import { usePushNotifications } from "@features/notifications/hooks/usePushNotifications"
import { Card } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Toggle component for enabling/disabling mobile notifications in settings.
 */
export default function MobileNotificationToggle() {
    const {
        isSupported,
        isSubscribed,
        permission,
        isLoading,
        subscribe,
        unsubscribe
    } = usePushNotifications()
    const colors = useThemeColors()

    if (!isSupported) {
        return (
            <Card variant="bordered">
                <View>
                    <Text className="text-base font-medium text-text">
                        Mobile Notifications
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-1">
                        Mobile notifications are not supported on this device.
                    </Text>
                </View>
            </Card>
        )
    }

    const handleToggle = async (value: boolean) => {
        if (value) {
            await subscribe()
        } else {
            await unsubscribe()
        }
    }

    return (
        <Card variant="bordered">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                    <Text className="text-base font-medium text-text">
                        Mobile Notifications
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-1">
                        {permission === "granted"
                            ? "Receive notifications on this device"
                            : permission === "denied"
                              ? "Permission denied. Enable in device settings."
                              : "Get notified about important updates"}
                    </Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Switch
                        value={isSubscribed}
                        onValueChange={handleToggle}
                        trackColor={{ false: "#D1D5DB", true: "#7A0019" }}
                        thumbColor={isSubscribed ? "#FFFFFF" : "#F3F4F6"}
                        disabled={permission === "denied"}
                    />
                )}
            </View>
        </Card>
    )
}
