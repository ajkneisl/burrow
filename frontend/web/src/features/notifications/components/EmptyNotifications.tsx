/**
 * The view when there's no notifications.
 *
 * @author AJ Kneisl
 */
export default function EmptyNotifications() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-base font-bold">You're all caught up!</div>
            <p className="mt-2 text-sm text-text/70">
                New notifications will appear here when you receive them.
            </p>
        </div>
    )
}
