import { del, get, post } from "@api/api.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import type { Notification } from "@features/notifications/notifications.types.ts"

/**
 * Get all of a user's notifications.
 *
 * @param page The page of notifications to retrieve.
 */
export async function getNotifications(
    page: number = 1
): Promise<PaginatedResponse<Notification>> {
    return get("/notifications", { query: { page } })
}

/**
 * Delete a notification.
 *
 * @param id The ID of the notification to delete.
 */
export async function deleteNotification(id: string): Promise<void> {
    return await del(`/notifications/${id}`)
}

/**
 * Clear all notifications
 */
export async function clearNotifications(): Promise<void> {
    return await del(`/notifications`)
}

/**
 * Toggle the read status on a notification.
 *
 * @param id The ID of the notification to toggle read status on.
 */
export async function toggleReadNotification(id: string): Promise<void> {
    return await post(`/notifications/${id}`)
}

/**
 * Get the VAPID public key for push notifications.
 */
export async function getVapidPublicKey(): Promise<string> {
    return await get<{ key: string }>("/notifications/push/vapid").then(
        (resp) => resp.key
    )
}

/**
 * Subscribe to push notifications.
 *
 * @param subscription The push subscription object from the browser.
 */
export async function subscribeToPush(
    subscription: PushSubscription
): Promise<void> {
    const key = subscription.getKey("p256dh")
    const auth = subscription.getKey("auth")

    if (!key || !auth) {
        throw new Error("Missing push subscription keys")
    }

    // Convert ArrayBuffer to base64
    const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)))
    const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)))

    return await post("/notifications/push/subscribe", {
        endpoint: subscription.endpoint,
        keys: {
            p256dh,
            auth: authBase64
        }
    })
}

/**
 * Unsubscribe from push notifications.
 *
 * @param endpoint The push endpoint to unsubscribe.
 */
export async function unsubscribeFromPush(endpoint: string): Promise<void> {
    return await post("/notifications/push/unsubscribe", {
        body: { endpoint }
    })
}
