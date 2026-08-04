import type { NotificationKind } from "../notifications/notifications.models"

/**
 * Notification delivery channels. These are a bitmask and must match
 * `DeliveryChannels` on the backend.
 */
export const MOBILE_CHANNEL = 0b1000
export const EMAIL_CHANNEL = 0b0100
export const BROWSER_CHANNEL = 0b0010
export const SSE_CHANNEL = 0b0001

/**
 * Preferences on a certain notification kind.
 *
 * @param kind The kind of notification to define preferences on.
 * @param enabled If the notification is enabled overall.
 * @param leadMinutes For certain kinds, how many minutes before an event to
 *   send a notification.
 * @param throttleMinutes For certain kinds, how many minutes until another
 *   notification should be sent.
 * @param deliveryChannels Where the notification should be sent.
 */
export type NotificationPreferences = {
    kind: NotificationKind
    enabled: boolean
    leadMinutes: number
    throttleMinutes: number
    deliveryChannels: number
}

/**
 * Empty {@link NotificationPreferences}.
 */
export const EMPTY_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    kind: "UPCOMING_MEETING",
    enabled: true,
    leadMinutes: 0,
    throttleMinutes: 0,
    deliveryChannels: EMAIL_CHANNEL | BROWSER_CHANNEL | SSE_CHANNEL
}

/**
 * General settings for a user.
 *
 * @param notificationsEnabled Whether notifications are globally enabled.
 * @param defaultNotificationDelivery Default delivery channels for notification
 *   kinds the user hasn't configured.
 */
export type GeneralSettings = {
    notificationsEnabled: boolean
    defaultNotificationDelivery: number
}

/**
 * The different types of themes.
 */
export type Theme = "DARK" | "LIGHT" | "AUTO" | "EARTH"
