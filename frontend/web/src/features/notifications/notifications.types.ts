export type NotificationKind = "UPCOMING_MEETING" | "NEW_MEETING" | "MEETING_MESSAGE" | "INVITE_RECEIVED"

export type Notification = {
    id: string
    userId: string
    meetingId: string | null
    kind: NotificationKind | null
    title: string
    content: string
    sentDate: number | null
    scheduledDate: number
    read: boolean
}