import type { Notification } from "@features/notifications/notifications.types.ts"
import clsx from "clsx"
import { formatTimeAgo } from "@api/util.ts"
import { Button } from "@umnburrow/core"

/**
 * {@link ViewNotification}
 */
type ViewNotificationProps = {
    notification: Notification
    clearOne: (id: string) => void
    toggleReadOne: (id: string) => void
    onAcceptInvite?: (params: {
        burrowId: string
        notificationId: string
    }) => void
    onDeclineInvite?: (params: {
        burrowId: string
        notificationId: string
    }) => void
}

/**
 * View an individual notification
 *
 * @param notification The notification object.
 * @param clearOne To clear the notification
 * @param toggleReadOne To toggle the read status on a notification.
 * @param onAcceptInvite To accept an invite notification.
 * @param onDeclineInvite To decline an invite notification.
 *
 * @author AJ Kneisl
 */
export default function ViewNotification({
    notification,
    clearOne,
    toggleReadOne,
    onAcceptInvite,
    onDeclineInvite
}: ViewNotificationProps) {
    const isInvite = notification.kind === "INVITE_RECEIVED"

    return (
        <article
            className={clsx(
                "group relative flex flex-col gap-3 rounded-2xl border border-background/80 bg-background/60 p-4 text-text transition-all select-none hover:border-primary/40",
                !notification?.read && "border-l-4 border-l-secondary"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                {/* header*/}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm leading-tight font-semibold">
                            {notification.title}
                        </h3>

                        {!notification.read && (
                            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-secondary" />
                        )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-text/70">
                        {notification.content}
                    </p>
                    <div className="mt-2 text-xs text-text/50">
                        {formatTimeAgo(
                            notification.sentDate || notification.scheduledDate
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 transition-opacity">
                {/* when it's invite, offer accept and decline */}
                {isInvite &&
                    notification.burrowID &&
                    onAcceptInvite &&
                    onDeclineInvite && (
                        <>
                            <Button
                                thin
                                color="SUCCESS"
                                onClick={() => {
                                    onAcceptInvite({
                                        burrowId: notification.burrowID!,
                                        notificationId: notification.id
                                    })
                                }}
                                aria-label="Accept invite"
                            >
                                Accept
                            </Button>

                            <Button
                                thin
                                color="WARNING"
                                onClick={() =>
                                    onDeclineInvite({
                                        burrowId: notification.burrowID!,
                                        notificationId: notification.id
                                    })
                                }
                                aria-label="Decline invite"
                            >
                                Decline
                            </Button>
                        </>
                    )}

                {/* mark as read when it's not an invite */}
                {!isInvite && !notification.read && (
                    <Button
                        thin
                        color="SUCCESS"
                        onClick={() => toggleReadOne(notification.id)}
                        aria-label="Mark as read"
                    >
                        Mark as Read
                    </Button>
                )}

                {/* clear */}
                <Button
                    thin
                    color="ERROR"
                    onClick={() => clearOne(notification.id)}
                    aria-label="Clear notification"
                >
                    Clear
                </Button>
            </div>
        </article>
    )
}
