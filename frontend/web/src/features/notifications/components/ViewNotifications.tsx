import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import useNotifications from "@features/notifications/hooks/UseNotifications.tsx"
import { useAtom } from "jotai"
import { notificationsAtom } from "@features/notifications/notifications.atom.ts"
import {
    clearNotifications,
    deleteNotification,
    getNotifications,
    toggleReadNotification
} from "@features/notifications/notifications.api.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import type { Notification } from "@features/notifications/notifications.types.ts"
import { formatTimeAgo } from "@api/util.ts"
import { Button } from "@umnburrow/core"
import clsx from "clsx"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"

/**
 * {@link Notification}
 */
type NotificationProps = {
    n: Notification
    clearOne: (id: string) => Promise<void>
    toggleReadOne: (id: string) => Promise<void>
}

/**
 * View an individual notification
 *
 * @param n The notification object.
 * @param clearOne To clear the notification
 * @param toggleReadOne To toggle the read status on a notification.
 * @constructor
 */
function Notification({ n, clearOne, toggleReadOne }: NotificationProps) {
    return (
        <article
            className={clsx(
                "text-text relative flex cursor-pointer select-none items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                !n.read &&
                    "border-secondary bg-card hover:bg-hero/30 border-l-8"
            )}
        >
            <div className="min-w-0 flex-1 pl-4">
                <h3 className="truncate text-sm font-semibold">{n.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-sm text-text/60">
                    {n.content}
                </p>
                <div className="mt-1 text-xs text-text/60">
                    {formatTimeAgo(n.date)}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 self-center">
                {!n.read && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleReadOne(n.id)
                        }}
                        title="Mark as read"
                        className="invisible rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-50 group-hover:visible"
                    >
                        Read
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        clearOne(n.id)
                    }}
                    title="Clear"
                    className="invisible rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-50 group-hover:visible"
                >
                    Clear
                </button>
            </div>
        </article>
    )
}

export default function ViewNotifications() {
    const auth = useToken()

    useNotifications() // set up live updates
    const [items, setItems] = useAtom(notificationsAtom)

    // load notifications initially
    useEffect(() => {
        if (auth !== null) {
            getNotifications(auth).then((notifications) =>
                setItems(notifications)
            )
        }
    }, [auth, setItems])

    const [open, setOpen] = useState(false)

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const panelRef = useRef<HTMLDivElement | null>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        // leave on outside click
        const handleClick = (e: MouseEvent) => {
            if (!open) return
            const target = e.target as Node

            const inPanel =
                panelRef.current && !panelRef.current.contains(target)

            const inButton =
                buttonRef.current && !buttonRef.current.contains(target)

            if (inPanel && inButton) {
                setOpen(false)
            }
        }

        // leave on escape
        const handleKey = (e: KeyboardEvent) => {
            if (!open) return
            if (e.key === "Escape") setOpen(false)
        }

        document.addEventListener("mousedown", handleClick)
        document.addEventListener("keydown", handleKey)

        return () => {
            document.removeEventListener("mousedown", handleClick)
            document.removeEventListener("keydown", handleKey)
        }
    }, [open])

    // how many notifications are unread
    const unreadCount = useMemo(
        () => items.filter((i) => !i.read).length,
        [items]
    )

    // clear a single notification
    async function clearOne(id: string) {
        setItems((prev) => prev.filter((n) => n.id !== id))

        if (auth !== null) await deleteNotification(auth, id)
    }

    // toggle read for a function
    async function toggleReadOne(id: string) {
        setItems((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )

        if (auth !== null) await toggleReadNotification(auth, id)
    }

    // clear all notifications
    async function clearAll() {
        setItems([])

        if (auth !== null) await clearNotifications(auth)
    }

    return (
        <div ref={wrapperRef} className={"relative inline-block text-left"}>
            {/* button */}
            <HeaderButton
                ref={buttonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                icon={
                    // bell icon
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M12 2a6 6 0 00-6 6v2.264c0 .72-.27 1.414-.756 1.944L3.7 14.9A1.5 1.5 0 005 17h14a1.5 1.5 0 001.3-2.1l-1.544-2.692A3 3 0 0118 10.264V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                }
            >
                {unreadCount > 0 && (
                    <span
                        aria-label={`${unreadCount} unread`}
                        className="absolute -right-1 -top-1 inline-flex min-w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow ring-2 ring-white"
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </HeaderButton>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            key="panel"
                            ref={panelRef}
                            role="dialog"
                            aria-label="Notifications"
                            className="absolute right-0 z-50 mt-2 w-[28rem] max-w-[92vw] origin-top-right border border-primary/30 rounded-2xl bg-card shadow-2xl"
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 26,
                                mass: 0.6
                            }}
                        >
                            <div className="text-text flex items-center justify-between gap-3 rounded-t-2xl px-4 py-3">
                                {/* header */}
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold">
                                        Notifications
                                    </div>

                                    <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-medium">
                                        {items.length}
                                    </span>
                                </div>

                                {/* clear all */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        color={"SECONDARY"}
                                        onClick={clearAll}
                                        disabled={items.length === 0}
                                    >
                                        Clear all
                                    </Button>
                                </div>
                            </div>

                            {/* notifications */}
                            <div className="text-text max-h-[60vh] overflow-y-auto px-1 py-2">
                                {items.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    <ul className="space-y-1.5">
                                        {items.map((n, idx) => (
                                            <motion.li
                                                key={n.id}
                                                className="group"
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{
                                                    delay: Math.min(
                                                        idx * 0.015,
                                                        0.12
                                                    )
                                                }}
                                            >
                                                <Notification
                                                    n={n}
                                                    clearOne={clearOne}
                                                    toggleReadOne={
                                                        toggleReadOne
                                                    }
                                                />
                                            </motion.li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="px-4 py-10 text-center">
            <div className="text-sm font-semibold">You're all caught up</div>
            <p className="mt-1 text-sm text-text/60">
                New notifications will appear here.
            </p>
        </div>
    )
}
