import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { BASE_URL } from "@api/util.ts"
import type { Notification } from "@features/notifications/notifications.types.ts"
import { useQueryClient, type InfiniteData } from "@tanstack/react-query"
import type { PaginatedResponse } from "@api/api.types.ts"

/**
 * Load the SSE for notifications and update the TanStack Query cache.
 *
 * @author AJ Kneisl
 */
export default function useNotifications() {
    const queryClient = useQueryClient()

    const [, setLastHeartBeat] = useState<number>(-1)

    useEffect(() => {
        const eventSource = new EventSource(`${BASE_URL}/notifications/live`, {
            withCredentials: true
        })

        // on heartbeat
        eventSource.addEventListener("heartbeat", () =>
            setLastHeartBeat(Date.now)
        )

        // on new notification
        eventSource.addEventListener("message", (e) => {
            const notification = JSON.parse(e.data) as Notification

            toast.custom(
                (t) => (
                    <motion.div
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, x: 300, y: -30 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 300, y: -30 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30
                        }}
                        className="w-80 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg"
                    >
                        <div className="flex items-start gap-3 p-4">
                            {/* Icon */}
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                                <svg
                                    className="h-5 w-5 text-red-600"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="M12 2a6 6 0 00-6 6v2.264c0 .72-.27 1.414-.756 1.944L3.7 14.9A1.5 1.5 0 005 17h14a1.5 1.5 0 001.3-2.1l-1.544-2.692A3 3 0 0118 10.264V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-semibold text-gray-900">
                                    {notification.title}
                                </h4>
                                <p className="mt-0.5 text-sm text-gray-600">
                                    {notification.content}
                                </p>
                            </div>

                            {/* Close */}
                            <button
                                onClick={() => toast.remove(t.id)}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Dismiss notification"
                            >
                                ✕
                            </button>
                        </div>

                        {/* timer */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 5, ease: "linear" }}
                            className="h-1 bg-red-500"
                            onAnimationComplete={() => toast.remove(t.id)}
                        />
                    </motion.div>
                ),
                {
                    id: notification.id,
                    position: "top-right",
                    duration: 5000
                }
            )

            // add notification to tanstack
            queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"], (old) => {
                if (!old) {
                    return {
                        pages: [
                            {
                                page: 1,
                                totalPages: 1,
                                totalResults: 1,
                                contents: [notification]
                            }
                        ],
                        pageParams: [1]
                    }
                }

                // add to first page.
                const newPages = [...old.pages]
                if (newPages.length > 0) {
                    newPages[0] = {
                        ...newPages[0],
                        contents: [notification, ...newPages[0].contents],
                        totalResults: newPages[0].totalResults + 1
                    }
                }

                return {
                    ...old,
                    pages: newPages
                }
            })
        })

        return () => {
            eventSource.close()
        }
    }, [queryClient])
}
