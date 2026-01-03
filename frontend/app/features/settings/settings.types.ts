/**
 * Notification kinds that can be configured.
 */
export enum NotificationKind {
    BURROW_INVITE = "BURROW_INVITE",
    BURROW_STARTS_SOON = "BURROW_STARTS_SOON",
    BURROW_CANCELLED = "BURROW_CANCELLED",
    BURROW_UPDATED = "BURROW_UPDATED",
    FRIEND_REQUEST = "FRIEND_REQUEST",
    NEW_FRIEND = "NEW_FRIEND",
    BURROW_CHAT_MESSAGE = "BURROW_CHAT_MESSAGE"
}

/**
 * Notification delivery channels (bitflags).
 */
export const PUSH_CHANNEL = 0b0100 // Mobile push notifications (Expo)
export const EMAIL_CHANNEL = 0b0010 // Email notifications
export const SSE_CHANNEL = 0b0001 // Server-Sent Events (real-time)

/**
 * Notification preference configuration for a specific notification kind.
 */
export type NotificationPreferences = {
    /** The kind of notification this preference applies to */
    kind: NotificationKind
    /** Whether notifications of this kind are enabled */
    enabled: boolean
    /** How many minutes before the event to send notification (for time-based notifications) */
    leadMinutes: number
    /** Minimum minutes between notifications of this kind (throttling) */
    throttleMinutes: number
    /** Bitflag of enabled delivery channels (PUSH_CHANNEL | EMAIL_CHANNEL | SSE_CHANNEL) */
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
