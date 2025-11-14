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
