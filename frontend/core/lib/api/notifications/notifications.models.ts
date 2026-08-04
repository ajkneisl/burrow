/**
 * The kinds of notifications.
 */
export type NotificationKind =
    | "UPCOMING_MEETING"
    | "NEW_MEETING"
    | "MEETING_MESSAGE"
    | "INVITE_RECEIVED"
    | "NEWSLETTER"
    | "RECOMMENDED"

/**
 * Every {@link NotificationKind}, in display order.
 */
export const NOTIFICATION_KINDS: NotificationKind[] = [
    "UPCOMING_MEETING",
    "NEW_MEETING",
    "MEETING_MESSAGE",
    "INVITE_RECEIVED",
    "NEWSLETTER",
    "RECOMMENDED"
]

/**
 * A notification.
 */
export type Notification = {
    id: string
    userID: string
    burrowID: string | null
    kind: NotificationKind | null
    title: string
    content: string
    sentDate: number | null
    scheduledDate: number
    read: boolean
}

/**
 * The keys used by the push subscription the browser hands back.
 */
export type PushSubscriptionKeys = {
    p256dh: string
    auth: string
}
