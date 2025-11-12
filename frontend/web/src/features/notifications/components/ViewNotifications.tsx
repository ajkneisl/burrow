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
                "border-background/80 bg-background/60 text-text group hover:border-primary/40 relative flex flex-col gap-3 rounded-2xl border p-4 transition-all select-none",
                !n.read && "border-l-secondary border-l-4"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <h3 className="text-sm leading-tight font-semibold">
                            {n.title}
                        </h3>
                        {!n.read && (
                            <span className="bg-secondary mt-0.5 h-2 w-2 shrink-0 rounded-full" />
                        )}
                    </div>
                    <p className="text-text/70 mt-1.5 line-clamp-2 text-sm">
                        {n.content}
                    </p>
                    <div className="text-text/50 mt-2 text-xs">
                        {formatTimeAgo(n.date)}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                {!n.read && (
                    <Button
                        thin
                        color="SUCCESS"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleReadOne(n.id)
                        }}
                        aria-label="Mark as read"
                    >
                        Mark as Read
                    </Button>
                )}
                <Button
                    thin
                    color="ERROR"
                    onClick={(e) => {
                        e.stopPropagation()
                        clearOne(n.id)
                    }}
                    aria-label="Clear notification"
                >
                    Clear
                </Button>
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
                        className="absolute -top-1 -right-1 inline-flex min-w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white shadow ring-2 ring-white"
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
                            className="bg-card border-card-border/30 absolute right-0 z-50 mt-2 w-[28rem] max-w-[92vw] origin-top-right rounded-2xl border shadow-2xl"
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
                            <div className="text-text border-card-border/20 flex items-center justify-between gap-3 border-b px-5 py-4">
                                {/* header */}
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold">
                                        Notifications
                                    </h2>

                                    {items.length > 0 && (
                                        <span className="bg-primary/20 text-text/70 rounded-full px-2 py-0.5 text-xs font-semibold">
                                            {items.length}
                                        </span>
                                    )}
                                </div>

                                {/* clear all */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        thin
                                        color={"ERROR"}
                                        onClick={clearAll}
                                        disabled={items.length === 0}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            {/* notifications */}
                            <div className="text-text max-h-[60vh] overflow-y-auto px-3 py-3">
                                {items.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    <ul className="space-y-3">
                                        {items.map((n, idx) => (
                                            <motion.li
                                                key={n.id}
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-base font-bold">You're all caught up!</div>
            <p className="text-text/70 mt-2 text-sm">
                New notifications will appear here when you receive them.
            </p>
        </div>
    )
}
