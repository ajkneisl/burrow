import { getMobileSubscriptionStatus, subscribeToPushMobile, unsubscribeFromPushMobile } from "@umnburrow/core/api"
import { useCallback, useEffect, useRef, useState } from "react"
import { Platform } from "react-native"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"

import Toast from "react-native-toast-message"
import { NotificationBehavior } from "expo-notifications"

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () =>
        ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true
        }) as NotificationBehavior
})

/**
 * Hooks for managing push notifications with Expo.
 *
 * @author AJ Kneisl
 */
export function usePushNotifications() {
    const router = useRouter()

    const [expoPushToken, setExpoPushToken] = useState<string>()
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [permission, setPermission] = useState<
        "granted" | "denied" | "undetermined"
    >("undetermined")
    const [isLoading, setIsLoading] = useState(true)

    const notificationListener = useRef<Notifications.EventSubscription | null>(
        null
    )
    const responseListener = useRef<Notifications.EventSubscription | null>(
        null
    )

    /**
     * Fetch subscription status from backend on mount.
     */
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setIsLoading(true)

                const { subscribed } = await getMobileSubscriptionStatus()
                setIsSubscribed(subscribed)

                const { status } = await Notifications.getPermissionsAsync()
                setPermission(
                    status === "granted"
                        ? "granted"
                        : status === "denied"
                          ? "denied"
                          : "undetermined"
                )
            } catch (error) {
                console.error(
                    "Error fetching mobile subscription status:",
                    error
                )
            } finally {
                setIsLoading(false)
            }
        }

        if (Device.isDevice) {
            void fetchStatus()
        }
    }, [])

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
            return (
                await Notifications.getExpoPushTokenAsync({
                    projectId: "3dc55916-e2a2-4081-a6cd-b76056b7386f"
                })
            ).data
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
                text1: `Failed to enable notifications`
            })
        } finally {
            setIsLoading(false)
        }
    }, [registerForPushNotificationsAsync])

    /**
     * Unsubscribe from push notifications.
     */
    const unsubscribe = useCallback(async () => {
        if (!isSubscribed) {
            Toast.show({
                type: "info",
                text1: "Not subscribed to notifications"
            })

            return
        }

        setIsLoading(true)

        try {
            await unsubscribeFromPushMobile()

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
    }, [isSubscribed])

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
            notificationListener.current?.remove()
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
            responseListener.current?.remove()
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
