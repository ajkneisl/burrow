/**
 * Notification kinds that can be configured.
 */
export enum NotificationKind {
    UPCOMING_MEETING = "UPCOMING_MEETING",
    NEW_MEETING = "NEW_MEETING",
    MEETING_MESSAGE = "MEETING_MESSAGE",
    INVITE_RECEIVED = "INVITE_RECEIVED",
    NEWSLETTER = "NEWSLETTER",
    RECOMMENDED = "RECOMMENDED"
}

/**
 * Notification delivery channels
 */
export const MOBILE_CHANNEL = 0b1000
export const BROWSER_CHANNEL = 0b0100
export const EMAIL_CHANNEL = 0b0010
export const SSE_CHANNEL = 0b0001

/**
 * Notification preference configuration for a specific notification kind.
 */
export type NotificationPreferences = {
    kind: NotificationKind
    enabled: boolean
    leadMinutes: number
    throttleMinutes: number
    deliveryChannels: number
}

/**
 * General settings response from the server.
 */
export type GeneralSettings = {
    /** Whether notifications are globally enabled */
    notificationsEnabled: boolean
    /** Default delivery channels for new notification types */
    defaultNotificationDelivery: number
}
