import type { Notification } from "@features/notifications/notifications.types.ts"
import { BASE_URL } from "@api/util.ts"

/**
 * Get all of a user's notifications.
 *
 * @param auth The authorization token.
 */
export async function getNotifications(auth: string): Promise<Notification[]> {
    const request = await fetch(`${BASE_URL}/notifications`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject("Failed to retrieve notifications.")
    }

    return await request.json()
}

/**
 * Delete a notification.
 *
 * @param auth The authorization token.
 * @param id The ID of the notification to delete.
 */
export async function deleteNotification(
    auth: string,
    id: string
): Promise<Notification[]> {
    const request = await fetch(`${BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject("Failed to delete a notification.")
    }

    return await request.json()
}

/**
 * Clear all notifications
 *
 * @param auth The authorization token.
 */
export async function clearNotifications(
    auth: string
): Promise<Notification[]> {
    const request = await fetch(`${BASE_URL}/notifications`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject("Failed to delete a notification.")
    }

    return await request.json()
}

/**
 * Toggle the read status on a notfication
 *
 * @param auth The authorization token.
 * @param id The ID of the notification to toggle read status on.
 */
export async function toggleReadNotification(
    auth: string,
    id: string
): Promise<Notification[]> {
    const request = await fetch(`${BASE_URL}/notifications/${id}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject("Failed to update a notification.")
    }

    return await request.json()
}
