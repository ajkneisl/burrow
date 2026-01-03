import { useEffect, useState, useRef, useCallback } from "react"
import { Platform } from "react-native"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"
import {
    subscribeToPushMobile,
    unsubscribeFromPushMobile
} from "@features/notifications/notifications.api"
import Toast from "react-native-toast-message"

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
    })
})

/**
 * Hook for managing push notifications on mobile using expo-notifications.
 *
 * Handles:
 * - Permission requests
 * - Getting Expo Push Token
 * - Subscribing/unsubscribing from push notifications
 * - Foreground/background notification handlers
 * - Deep linking from notification taps
 */
export function usePushNotifications() {
    const router = useRouter()
    const [expoPushToken, setExpoPushToken] = useState<string>()
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [permission, setPermission] = useState<
        "granted" | "denied" | "undetermined"
    >("undetermined")
    const [isLoading, setIsLoading] = useState(false)

    const notificationListener = useRef<Notifications.Subscription>()
    const responseListener = useRef<Notifications.Subscription>()

    /**
     * Register for push notifications and get Expo Push Token.
     */
    const registerForPushNotificationsAsync = useCallback(async () => {
        if (!Device.isDevice) {
            Toast.show({
                type: "error",
                text1: "Push notifications don't work on simulator"
            })
            return null
        }

        const { status: existingStatus } =
            await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }

        if (finalStatus !== "granted") {
            setPermission("denied")
            Toast.show({
                type: "error",
                text1: "Permission denied",
                text2: "Failed to get push notification permissions"
            })
            return null
        }

        setPermission("granted")

        try {
            const token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: "your-project-id" // TODO: Replace with actual project ID
                })
            ).data
            return token
        } catch (error) {
            console.error("Error getting Expo push token:", error)
            Toast.show({
                type: "error",
                text1: "Failed to get push token"
            })
            return null
        }
    }, [])

    /**
     * Subscribe to push notifications.
     */
    const subscribe = useCallback(async () => {
        setIsLoading(true)

        try {
            const token = await registerForPushNotificationsAsync()

            if (!token) {
                setIsLoading(false)
                return
            }

            // Send token to backend
            await subscribeToPushMobile(token)

            setExpoPushToken(token)
            setIsSubscribed(true)

            Toast.show({
                type: "success",
                text1: "Push notifications enabled"
            })
        } catch (error) {
            console.error("Error subscribing to push notifications:", error)
            Toast.show({
                type: "error",
                text1: "Failed to enable notifications"
            })
        } finally {
            setIsLoading(false)
        }
    }, [registerForPushNotificationsAsync])

    /**
     * Unsubscribe from push notifications.
     */
    const unsubscribe = useCallback(async () => {
        if (!expoPushToken) {
            Toast.show({
                type: "info",
                text1: "Not subscribed to notifications"
            })
            return
        }

        setIsLoading(true)

        try {
            await unsubscribeFromPushMobile(expoPushToken)
            setIsSubscribed(false)
            setExpoPushToken(undefined)

            Toast.show({
                type: "success",
                text1: "Push notifications disabled"
            })
        } catch (error) {
            console.error("Error unsubscribing from push notifications:", error)
            Toast.show({
                type: "error",
                text1: "Failed to disable notifications"
            })
        } finally {
            setIsLoading(false)
        }
    }, [expoPushToken])

    /**
     * Handle notification received in foreground.
     */
    useEffect(() => {
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log("Notification received:", notification)
                // Notification will be shown automatically by the handler
            })

        return () => {
            if (notificationListener.current) {
                // Notifications.removeNotificationSubscription(
                //     notificationListener.current
                // )
            }
        }
    }, [])

    /**
     * Handle notification tap (deep linking).
     */
    useEffect(() => {
        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const data = response.notification.request.content.data

                    // Deep link based on notification type
                    if (data.burrowID) {
                        router.push(`/burrow/${data.burrowID}`)
                    } else if (data.topicID) {
                        router.push(`/discuss/${data.topicID}`)
                    } else if (data.screen) {
                        router.push(data.screen as any)
                    }
                }
            )

        return () => {
            if (responseListener.current) {
                // Notifications.removeNotificationSubscription(
                //     responseListener.current
                // )
            }
        }
    }, [router])

    /**
     * Configure notification channels for Android.
     */
    useEffect(() => {
        if (Platform.OS === "android") {
            Notifications.setNotificationChannelAsync("default", {
                name: "Default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#7A0019"
            })
        }
    }, [])

    return {
        isSupported: Device.isDevice,
        isSubscribed,
        permission,
        isLoading,
        expoPushToken,
        subscribe,
        unsubscribe
    }
}
