import { AnimatePresence, motion } from "framer-motion"
import React, { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import type {
    GroupMeetingResponse,
    GroupType
} from "@features/groups/groups.types.ts"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { GroupMeetingCard } from "@features/groups/components/GroupMeetingCard.tsx"
import { searchMeetings } from "@features/groups/groups.api.ts"
import MeetingHeatmap from "@features/groups/components/MeetingHeatmap.tsx"
import { Input, useDateRangePicker } from "@umnburrow/core"
import clsx from "clsx"

/**
 * Convert a date into a more readable one.
 *
 * @param key The readable date.
 */
function humanDateLabel(key: string): string {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    const keyDate = new Date(key)

    const isSame = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

    if (isSame(keyDate, today)) return "Today"
    if (isSame(keyDate, tomorrow)) return "Tomorrow"

    return keyDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
    })
}

function weekRangeLabel(dateMs: number): string {
    const d = new Date(dateMs)
    d.setHours(0, 0, 0, 0)
    // Make Monday = 0, Sunday = 6
    const day = d.getDay()
    const offsetToMonday = (day + 6) % 7

    const start = new Date(d)
    start.setDate(d.getDate() - offsetToMonday)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const formatDay = (date: Date) => {
        const monthName = date.toLocaleString("default", { month: "long" })
        const day = date.getDate()
        const suffix =
            day % 10 === 1 && day !== 11
                ? "st"
                : day % 10 === 2 && day !== 12
                  ? "nd"
                  : day % 10 === 3 && day !== 13
                    ? "rd"
                    : "th"
        return `${monthName} ${day}${suffix}`
    }

    return `${formatDay(start)} — ${formatDay(end)}`
}

/**
 * {@link Browse}
 */
type AllMeetingsProps = {
    type: GroupType
}

/**
 * Search through all meetings.
 *
 * @param type The type of meetings.
 */
export default function Browse({ type }: AllMeetingsProps) {
    const [query, setQuery] = useState("")
    const [auth] = useAtom(authToken)

    const [startDate, endDate, picker] = useDateRangePicker()

    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())

    const toggleWeek = (label: string) => {
        setExpandedWeeks((prev) => {
            const next = new Set(prev)
            if (next.has(label)) next.delete(label)
            else next.add(label)
            return next
        })
    }

    const dayStart = useMemo(() => {
        const d = new Date(
            (startDate as number | undefined) ?? new Date().valueOf()
        )
        d.setHours(0, 0, 0, 0)
        return d.getTime()
    }, [startDate])

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["meetings", type, query, startDate, endDate],
        queryFn: async () =>
            await searchMeetings(
                auth,
                type,
                query,
                startDate as number | undefined,
                endDate as number | undefined
            ),
        refetchOnWindowFocus: false
    })

    const allMeetings: GroupMeetingResponse[] = useMemo(
        () => data ?? [],
        [data]
    )

    const filtered = useMemo(() => {
        const searchQuery = query.trim().toLowerCase()

        const byDate = allMeetings.filter((m) => {
            return m.meeting.beginningTime >= dayStart
        })

        return byDate
            .filter((meeting) => {
                return (
                    !searchQuery ||
                    meeting.meeting.title.toLowerCase().includes(searchQuery) ||
                    meeting.meeting.description
                        .toLowerCase()
                        .includes(searchQuery) ||
                    meeting.meeting.tags.some((tag) =>
                        tag.toLowerCase().includes(searchQuery)
                    )
                )
            })
            .sort((a, b) => a.meeting.beginningTime - b.meeting.beginningTime)
    }, [allMeetings, query, dayStart])

    const groupedByDate = useMemo(() => {
        const map = new Map<string, GroupMeetingResponse[]>()

        filtered.forEach((m) => {
            const d = new Date(m.meeting.beginningTime)
            d.setHours(0, 0, 0, 0)
            const key = d.toISOString().slice(0, 10) // YYYY-MM-DD, stable & sortable
            const list = map.get(key) ?? []
            list.push(m)
            map.set(key, list)
        })

        const entries = Array.from(map.entries()).sort(([a], [b]) => {
            const aMs = new Date(a).getTime()
            const bMs = new Date(b).getTime()
            return aMs - bMs
        })

        // Get today at midnight for comparison
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayMs = today.getTime()

        return entries
            .map(([key, list]) => {
                const firstTime =
                    list[0]?.meeting.beginningTime ?? new Date(key).getTime()
                return { key, list, week: weekRangeLabel(firstTime) }
            })
            .filter(({ key }) => {
                // Only show dates from today onwards
                const dateMs = new Date(key).getTime()
                return dateMs >= todayMs
            })
    }, [filtered])

    // Initialize: expand only the current week (which includes Today)
    useEffect(() => {
        if (groupedByDate.length === 0) return
        const currentWeekLabel = weekRangeLabel(Date.now())
        setExpandedWeeks(new Set([currentWeekLabel]))
    }, [groupedByDate])

    if (error)
        return (
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <div className="border-error/30 bg-error/10 text-error rounded-2xl border p-4">
                    Failed to load meetings.
                </div>
            </main>
        )

    return (
        <main className="flex grid-cols-3 flex-col-reverse lg:grid">
            <section className="col-span-2 mx-auto w-full max-w-4xl p-4 sm:p-6">
                {/* top controls */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* search */}
                    <div className="flex-1">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search meetings…"
                        />
                    </div>

                    {/* calendar */}
                    <div className="flex items-center gap-2">{picker}</div>
                </div>

                {isLoading && !data ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-card h-32 animate-pulse rounded-2xl shadow-sm"
                            />
                        ))}
                    </div>
                ) : null}

                {!isLoading && isFetching ? (
                    <div className="mb-4 text-right">
                        <span className="border-info/30 bg-info/10 text-info inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                            <svg
                                className="h-3 w-3 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Updating…
                        </span>
                    </div>
                ) : null}

                {/* search results */}
                {groupedByDate.length === 0 ? (
                    <div className="border-primary/20 bg-card text-text rounded-2xl border p-6 shadow-sm">
                        <p className="text-sm font-medium">
                            No meetings match your filters.
                        </p>
                        <p className="text-text/70 mt-1 text-xs">
                            Try adjusting your search or picking a different
                            date.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groupedByDate.map(
                            ({ key: dateKey, list: meetings, week }, idx) => {
                                const isFirstOfWeek =
                                    idx === 0 ||
                                    groupedByDate[idx - 1].week !== week
                                const isExpanded = expandedWeeks.has(week)

                                return (
                                    <React.Fragment key={dateKey}>
                                        {/* Week header - only show at start of new week */}
                                        {isFirstOfWeek && (
                                            <button
                                                onClick={() => toggleWeek(week)}
                                                className="group text-text/60 hover:text-text mb-6 flex w-full cursor-pointer items-center gap-3 text-xs font-semibold tracking-wider uppercase transition-colors"
                                                aria-expanded={isExpanded}
                                            >
                                                <svg
                                                    className={clsx(
                                                        "h-4 w-4 transition-transform duration-200",
                                                        isExpanded
                                                            ? "rotate-90"
                                                            : "rotate-0"
                                                    )}
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <span>{week}</span>
                                                <span className="bg-text/20 h-px flex-1" />
                                            </button>
                                        )}

                                        {/* Day section */}
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    key={`day-${dateKey}`}
                                                    initial={{
                                                        height: 0,
                                                        opacity: 0
                                                    }}
                                                    animate={{
                                                        height: "auto",
                                                        opacity: 1
                                                    }}
                                                    exit={{
                                                        height: 0,
                                                        opacity: 0
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                        ease: "easeOut"
                                                    }}
                                                    className="space-y-4 overflow-hidden"
                                                >
                                                    {/* Day label */}
                                                    <h3 className="text-text mb-4 flex items-center gap-3 text-base font-semibold">
                                                        {humanDateLabel(
                                                            dateKey
                                                        )}
                                                        <span className="bg-text/10 h-px flex-1" />
                                                    </h3>

                                                    {/* Meetings for this day */}
                                                    <div className="space-y-3 pb-4">
                                                        {meetings.map((m) => (
                                                            <GroupMeetingCard
                                                                details={true}
                                                                key={
                                                                    m.meeting.id
                                                                }
                                                                meetingResponse={
                                                                    m
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                )
                            }
                        )}
                    </div>
                )}
            </section>

            <aside className="col-span-1 mt-5">
                <MeetingHeatmap />
            </aside>
        </main>
    )
}
