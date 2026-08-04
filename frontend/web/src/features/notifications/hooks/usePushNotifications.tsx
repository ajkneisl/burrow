import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from "@umnburrow/core/api"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

/**
 * Hook for managing push notification subscriptions.
 *
 * Handles:
 * - Service worker registration
 * - Push notification permission requests
 * - Subscribing/unsubscribing from push notifications
 * - Checking subscription status
 */
export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [permission, setPermission] =
        useState<NotificationPermission>("default")
    const [isLoading, setIsLoading] = useState(false)

    // Check if push notifications are supported
    useEffect(() => {
        const supported =
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window

        setIsSupported(supported)

        if (supported) {
            setPermission(Notification.permission)
            checkSubscription()
        }
    }, [])

    /**
     * Check if the user is currently subscribed to push notifications.
     */
    const checkSubscription = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription =
                await registration.pushManager.getSubscription()
            setIsSubscribed(subscription !== null)
        } catch (error) {
            console.error("Error checking subscription:", error)
        }
    }, [])

    /**
     * Register the service worker.
     */
    const registerServiceWorker =
        useCallback(async (): Promise<ServiceWorkerRegistration> => {
            try {
                const registration = await navigator.serviceWorker.register(
                    "/sw.js",
                    {
                        scope: "/"
                    }
                )

                // Wait for the service worker to be ready
                await navigator.serviceWorker.ready

                console.log("Service worker registered successfully")
                return registration
            } catch (error) {
                console.error("Service worker registration failed:", error)
                throw error
            }
        }, [])

    /**
     * Subscribe to push notifications.
     */
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            toast.error("Push notifications are not supported in this browser")
            return
        }

        setIsLoading(true)

        try {
            const permissionResult = await Notification.requestPermission()
            setPermission(permissionResult)

            if (permissionResult !== "granted") {
                toast.error("Notification permission denied")
                setIsLoading(false)
                return
            }

            let registration =
                await navigator.serviceWorker.getRegistration("/")
            if (!registration) {
                registration = await registerServiceWorker()
            }

            // get VAPID key
            const publicKey = await getVapidPublicKey()
            console.log("vapid %o", publicKey)
            const applicationServerKey = urlBase64ToUint8Array(publicKey)

            // subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            })

            const p256dh = subscription.getKey("p256dh")
            const authKey = subscription.getKey("auth")

            if (!p256dh || !authKey) {
                throw new Error("Missing push subscription keys")
            }

            await subscribeToPush(subscription.endpoint, {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
                auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
            })

            setIsSubscribed(true)
            toast.success("Successfully subscribed to push notifications")
        } catch (error) {
            console.error("Error subscribing to push notifications:", error)
            toast.error("Failed to subscribe to push notifications")
        } finally {
            setIsLoading(false)
        }
    }, [isSupported, registerServiceWorker])

    /**
     * Unsubscribe from push notifications.
     */
    const unsubscribe = useCallback(async () => {
        setIsLoading(true)

        try {
            const registration = await navigator.serviceWorker.ready
            const subscription =
                await registration.pushManager.getSubscription()

            if (!subscription) {
                toast("You are not subscribed to push notifications")
                setIsLoading(false)
                return
            }

            // Unsubscribe from push service
            await subscription.unsubscribe()

            // Notify backend
            await unsubscribeFromPush(subscription.endpoint)

            setIsSubscribed(false)
            toast.success("Successfully unsubscribed from push notifications")
        } catch (error) {
            console.error("Error unsubscribing from push notifications:", error)
            toast.error("Failed to unsubscribe from push notifications")
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        isSupported,
        isSubscribed,
        permission,
        isLoading,
        subscribe,
        unsubscribe,
        checkSubscription
    }
}

/**
 * Convert a base64 string to a Uint8Array for VAPID.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}
