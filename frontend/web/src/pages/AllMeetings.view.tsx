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
 * {@link AllMeetings}
 */
type AllMeetingsProps = {
    type: GroupType
}

/**
 * Search through all meetings.
 *
 * @param type The type of meetings.
 */
export default function AllMeetings({ type }: AllMeetingsProps) {
    const [query, setQuery] = useState("")
    const [auth] = useAtom(authToken)
    const [selectedDate, setSelectedDate] = useState<string>()

    const [hiddenWeeks, setHiddenWeeks] = useState<Set<string>>(new Set())
    const [hiddenDays, setHiddenDays] = useState<Set<string>>(new Set())

    const toggleWeek = (label: string) => {
        setHiddenWeeks((prev) => {
            const next = new Set(prev)
            if (next.has(label)) next.delete(label)
            else next.add(label)
            return next
        })
    }

    const toggleDay = (dateKey: string) => {
        setHiddenDays((prev) => {
            const next = new Set(prev)
            if (next.has(dateKey)) next.delete(dateKey)
            else next.add(dateKey)
            return next
        })
    }

    const dateEpoch = useMemo(() => {
        if (!selectedDate) return null

        const parts = selectedDate.split("-")
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)

        // don't request until reaching a real year
        if (year < 2025) return null

        return new Date(year, month, day).valueOf()
    }, [selectedDate])

    const dayStart = useMemo(() => {
        const d = new Date(dateEpoch ?? new Date().getDate())
        d.setHours(0, 0, 0, 0)
        return d.getTime()
    }, [dateEpoch])

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["meetings", type, query, dateEpoch],
        queryFn: async () =>
            await searchMeetings(auth, type, query, dateEpoch ?? undefined),
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
            const key = new Date(m.meeting.beginningTime).toLocaleDateString()
            const list = map.get(key) ?? []
            list.push(m)
            map.set(key, list)
        })

        const entries = Array.from(map.entries()).sort(([a], [b]) =>
            a < b ? -1 : 1
        )

        return entries.map(([key, list]) => {
            // compute week label from the first meeting's beginningTime in this day
            const firstTime =
                list[0]?.meeting.beginningTime ?? new Date(key).getTime()
            return { key, list, week: weekRangeLabel(firstTime) }
        })
    }, [filtered])

    useEffect(() => {
        if (groupedByDate.length === 0) return
        const currentWeekLabel = weekRangeLabel(Date.now())
        const allWeeks = new Set(groupedByDate.map((g) => g.week))
        const hidden = new Set(
            [...allWeeks].filter((w) => w !== currentWeekLabel)
        )
        setHiddenWeeks(hidden)
    }, [groupedByDate])

    if (error)
        return (
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-error">
                    Failed to load meetings.
                </div>
            </main>
        )

    return (
        <main className="lg:grid grid-cols-3 flex flex-col-reverse">
            <section className="col-span-2 mx-auto w-full max-w-4xl p-4 sm:p-6">
                {/* top controls */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* search */}
                    <div className="flex-1">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search meetings…"
                            className="w-full rounded-2xl border border-primary/20 bg-card px-4 py-2 text-sm text-text shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                    </div>

                    {/* calendar */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm text-text shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Select date"
                        />
                    </div>
                </div>

                {isLoading && !data ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-24 rounded-2xl bg-card shadow-sm"
                            />
                        ))}
                    </div>
                ) : null}

                {!isLoading && isFetching ? (
                    <div className="mb-2 text-right">
                        <span className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-2 py-1 text-xs text-info">
                            Updating…
                        </span>
                    </div>
                ) : null}

                {/* search results */}
                {groupedByDate.length === 0 ? (
                    <div className="rounded-2xl border border-primary/20 bg-card p-6 text-text shadow-sm">
                        <p className="text-sm">
                            No meetings match your filters.
                        </p>
                        <p className="mt-1 text-xs text-text/70">
                            Try adjusting your search or picking a different
                            date.
                        </p>
                    </div>
                ) : (
                    groupedByDate.map(
                        ({ key: dateKey, list: meetings, week }, idx) => (
                            <React.Fragment key={dateKey}>
                                {idx === 0 ||
                                groupedByDate[idx - 1].week !== week ? (
                                    <h2
                                        className="md:min-w-[430px] mb-3 flex cursor-pointer select-none items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text/70 hover:text-text"
                                        onClick={() => toggleWeek(week)}
                                        title={
                                            hiddenWeeks.has(week)
                                                ? "Show week"
                                                : "Hide week"
                                        }
                                        role="button"
                                        aria-expanded={!hiddenWeeks.has(week)}
                                    >
                                        <span className="h-px flex-1 bg-text/40" />
                                        {week}
                                        <span className="h-px flex-1 bg-text/40" />
                                        <svg
                                            className={`ml-2 h-3 w-3 transition-transform duration-200 ${hiddenWeeks.has(week) ? "rotate-0" : "rotate-90"}`}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </h2>
                                ) : null}

                                <AnimatePresence initial={false}>
                                    {!hiddenWeeks.has(week) && (
                                        <motion.section
                                            key={`week-${week}-${dateKey}`}
                                            className="mb-10"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                ease: "easeOut"
                                            }}
                                        >
                                            <h2
                                                className="mb-3 flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-text hover:text-text/80"
                                                onClick={() =>
                                                    toggleDay(dateKey)
                                                }
                                                title={
                                                    hiddenDays.has(dateKey)
                                                        ? "Show day"
                                                        : "Hide day"
                                                }
                                                role="button"
                                                aria-expanded={
                                                    !hiddenDays.has(dateKey)
                                                }
                                            >
                                                {humanDateLabel(dateKey)}
                                                <span className="h-px flex-1 bg-text/50" />
                                                <svg
                                                    className={`ml-2 h-3 w-3 transition-transform duration-200 ${hiddenDays.has(dateKey) ? "rotate-0" : "rotate-90"}`}
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </h2>

                                            {/* Day content with its own collapse animation */}
                                            <AnimatePresence initial={false}>
                                                {!hiddenDays.has(dateKey) && (
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
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            {meetings.map(
                                                                (m) => (
                                                                    <GroupMeetingCard
                                                                        key={
                                                                            m
                                                                                .meeting
                                                                                .id
                                                                        }
                                                                        {...m}
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.section>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        )
                    )
                )}
            </section>

            <aside className="col-span-1 mt-5">
                <MeetingHeatmap />
            </aside>
        </main>
    )
}
