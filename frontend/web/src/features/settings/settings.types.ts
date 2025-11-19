import type { NotificationKind } from "@features/notifications/notifications.types.ts"

/**
 * Preferences on a certain notification kind.
 *
 * @param kind The kind of notification to define preferences on.
 * @param enabled If the notification is enabled overall.
 * @param leadMinutes For certain kinds, how many minutes before an event to send a notification.
 * @param throttleMinutes For certain kinds, how many minutes until another notification should be sent.
 * @param deliveryChannels Where should the notification be sent.
 */
export type NotificationPreferences = {
    kind: NotificationKind
    enabled: boolean
    leadMinutes: number
    throttleMinutes: number
    deliveryChannels: number
}

export const EMAIL_CHANNEL = 0b0100 // 4
export const BROWSER_CHANNEL = 0b0010 // 2
export const SSE_CHANNEL = 0b0001 // 1

/**
 * Empty {@link NotificationPreferences}
 */
export const EMPTY_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    kind: "UPCOMING_MEETING",
    enabled: true,
    leadMinutes: 0,
    throttleMinutes: 0,
    deliveryChannels: EMAIL_CHANNEL | BROWSER_CHANNEL | SSE_CHANNEL // 0b0111 = 7
}