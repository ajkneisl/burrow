import { del, get, post } from "../client"
import type { PaginatedResponse } from "../types"
import type {
    Notification,
    PushSubscriptionKeys
} from "./notifications.models"

/**
 * Get a page of the requesting user's notifications.
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
    return del(`/notifications/${id}`)
}

/**
 * Clear all notifications.
 */
export async function clearNotifications(): Promise<void> {
    return del("/notifications")
}

/**
 * Toggle the read status on a notification.
 *
 * @param id The ID of the notification to toggle.
 */
export async function toggleReadNotification(id: string): Promise<void> {
    return post(`/notifications/${id}`)
}

/**
 * Get the VAPID public key used to subscribe to browser push.
 */
export async function getVapidPublicKey(): Promise<string> {
    const response = await get<{ key: string }>("/notifications/push/vapid")

    return response.key
}

/**
 * Subscribe to browser push notifications.
 *
 * @param endpoint The push endpoint the browser handed back.
 * @param keys The base64 encoded subscription keys.
 */
export async function subscribeToPush(
    endpoint: string,
    keys: PushSubscriptionKeys
): Promise<void> {
    return post("/notifications/push/subscribe", { endpoint, keys })
}

/**
 * Unsubscribe from browser push notifications.
 *
 * @param endpoint The push endpoint to unsubscribe.
 */
export async function unsubscribeFromPush(endpoint: string): Promise<void> {
    return post("/notifications/push/unsubscribe", { endpoint })
}

/**
 * Check whether the requesting user has any mobile push subscriptions.
 */
export async function getMobileSubscriptionStatus(): Promise<{
    subscribed: boolean
}> {
    return get("/notifications/mobile/status")
}

/**
 * Subscribe to mobile push notifications.
 *
 * @param deviceToken The Expo push token from the device.
 */
export async function subscribeToPushMobile(
    deviceToken: string
): Promise<void> {
    return post("/notifications/mobile/subscribe", { deviceToken })
}

/**
 * Unsubscribe from mobile push notifications.
 */
export async function unsubscribeFromPushMobile(): Promise<void> {
    return post("/notifications/mobile/unsubscribe")
}
