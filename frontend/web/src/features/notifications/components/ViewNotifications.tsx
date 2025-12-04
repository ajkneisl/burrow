import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import useNotifications from "@features/notifications/hooks/UseNotifications.tsx"
import { Button } from "@umnburrow/core"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"
import {
    useNotificationsQuery,
    useDeleteNotification,
    useToggleReadNotification,
    useClearAllNotifications
} from "@features/notifications/notifications.queries.ts"
import {
    acceptInvite,
    declineInvite
} from "@features/burrows/attendees/attendees.api.ts"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import ViewNotification from "@features/notifications/components/ViewNotification.tsx"
import EmptyNotifications from "@features/notifications/components/EmptyNotifications.tsx"
import { BellIcon } from "lucide-react"

/**
 * View all notifications
 */
export default function ViewNotifications() {
    useNotifications() // set up live updates

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useNotificationsQuery()

    const deleteMutation = useDeleteNotification()
    const toggleReadMutation = useToggleReadNotification()
    const clearAllMutation = useClearAllNotifications()

    const [open, setOpen] = useState(false)

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const panelRef = useRef<HTMLDivElement | null>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

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

    // Handle infinite scroll
    useEffect(() => {
        const scrollElement = scrollRef.current
        if (!scrollElement || !open) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollElement
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

            if (isNearBottom && hasNextPage && !isFetchingNextPage) {
                void fetchNextPage()
            }
        }

        scrollElement.addEventListener("scroll", handleScroll)
        return () => scrollElement.removeEventListener("scroll", handleScroll)
    }, [open, hasNextPage, isFetchingNextPage, fetchNextPage])

    // Flatten all notifications from pages
    const items = useMemo(() => {
        if (!data) return []

        return data.pages.flatMap((page) => {
            return page.contents
        })
    }, [data])

    // how many notifications are unread
    const unreadCount = useMemo(
        () => items.filter((i) => !i?.read).length,
        [items]
    )

    const queryClient = useQueryClient()

    // Handle invite actions
    const acceptInviteMutation = useMutation({
        mutationFn: async ({
            burrowId,
            notificationId
        }: {
            burrowId: string
            notificationId: string
        }) => {
            await acceptInvite(burrowId)
            return notificationId
        },

        onSuccess: (notificationId) => {
            toast.success("Invite accepted!")
            deleteMutation.mutate(notificationId)
            void queryClient.invalidateQueries({ queryKey: ["notifications"] })
        },

        onError: () => {
            toast.error("Failed to accept invite")
        }
    })

    // decline invite
    const declineInviteMutation = useMutation({
        mutationFn: async ({
            burrowId,
            notificationId
        }: {
            burrowId: string
            notificationId: string
        }) => {
            await declineInvite(burrowId)
            return notificationId
        },

        onSuccess: (notificationId) => {
            toast.success("Invite declined")
            deleteMutation.mutate(notificationId)
            void queryClient.invalidateQueries({ queryKey: ["notifications"] })
        },

        onError: () => {
            toast.error("Failed to decline invite")
        }
    })

    return (
        <div ref={wrapperRef} className={"relative inline-block text-left"}>
            {/* button */}
            <HeaderButton
                description="Notifications"
                ref={buttonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                icon={<BellIcon className="h-5 w-5" />}
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
                            className="bg-card border-card-border/30 absolute left-1/2 z-50 mt-2 w-[18rem] max-w-[92vw] origin-top-right -translate-x-3/4 rounded-2xl border shadow-2xl md:right-0 md:left-auto md:w-[28rem] md:translate-x-0"
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
                                        onClick={() =>
                                            clearAllMutation.mutate()
                                        }
                                        disabled={items.length === 0}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            {/* notifications */}
                            <div
                                ref={scrollRef}
                                className="text-text max-h-[60vh] overflow-y-auto px-3 py-3"
                            >
                                {items.length === 0 ? (
                                    <EmptyNotifications />
                                ) : (
                                    <>
                                        <ul className="space-y-3">
                                            {items.map((n, idx) => (
                                                <motion.li
                                                    key={n.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: -6
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0
                                                    }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{
                                                        delay: Math.min(
                                                            idx * 0.015,
                                                            0.12
                                                        )
                                                    }}
                                                >
                                                    <ViewNotification
                                                        notification={n}
                                                        clearOne={
                                                            deleteMutation.mutate
                                                        }
                                                        toggleReadOne={
                                                            toggleReadMutation.mutate
                                                        }
                                                        onAcceptInvite={
                                                            acceptInviteMutation.mutate
                                                        }
                                                        onDeclineInvite={
                                                            declineInviteMutation.mutate
                                                        }
                                                    />
                                                </motion.li>
                                            ))}
                                        </ul>

                                        {/* load more */}
                                        {isFetchingNextPage && (
                                            <div className="text-text/60 mt-4 text-center text-sm">
                                                Loading more...
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
