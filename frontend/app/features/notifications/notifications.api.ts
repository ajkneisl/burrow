import { del, get, post } from "@api/api"
import type { PaginatedResponse } from "@api/api.types"
import type { Notification } from "@features/notifications/notifications.types"

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
 * Get mobile push notification subscription status.
 *
 * @returns Whether the user has any mobile push subscriptions.
 */
export async function getMobileSubscriptionStatus(): Promise<{ subscribed: boolean }> {
    return await get("/notifications/mobile/status")
}

/**
 * Subscribe to mobile push notifications with Expo Push Token.
 *
 * @param deviceToken The Expo push token from the device.
 */
export async function subscribeToPushMobile(deviceToken: string): Promise<void> {
    return await post("/notifications/mobile/subscribe", { deviceToken })
}

/**
 * Unsubscribe from mobile push notifications.
 *
 * @param deviceToken The Expo push token to unsubscribe.
 */
export async function unsubscribeFromPushMobile(): Promise<void> {
    return await post("/notifications/mobile/unsubscribe")
}
