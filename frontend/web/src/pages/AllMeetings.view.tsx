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

    const [startDate, endDate, picker] = useDateRangePicker()

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

        // Exclude past dates
        const now = Date.now()

        return entries
            .map(([key, list]) => {
                const firstTime =
                    list[0]?.meeting.beginningTime ?? new Date(key).getTime()
                return { key, list, week: weekRangeLabel(firstTime) }
            })
            .filter(({ list }) => {
                // Check if the day's latest meeting has ended before now
                const latestEnd = Math.max(
                    ...list.map(
                        (m) => m.meeting.endTime ?? m.meeting.beginningTime
                    )
                )
                return latestEnd >= now
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
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-card h-24 rounded-2xl shadow-sm"
                            />
                        ))}
                    </div>
                ) : null}

                {!isLoading && isFetching ? (
                    <div className="mb-2 text-right">
                        <span className="border-info/30 bg-info/10 text-info inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
                            Updating…
                        </span>
                    </div>
                ) : null}

                {/* search results */}
                {groupedByDate.length === 0 ? (
                    <div className="border-primary/20 bg-card text-text rounded-2xl border p-6 shadow-sm">
                        <p className="text-sm">
                            No meetings match your filters.
                        </p>
                        <p className="text-text/70 mt-1 text-xs">
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
                                        className="text-text/70 hover:text-text mb-3 flex cursor-pointer items-center gap-2 text-xs font-semibold tracking-wide uppercase select-none md:min-w-[430px]"
                                        onClick={() => toggleWeek(week)}
                                        title={
                                            hiddenWeeks.has(week)
                                                ? "Show week"
                                                : "Hide week"
                                        }
                                        role="button"
                                        aria-expanded={!hiddenWeeks.has(week)}
                                    >
                                        <span className="bg-text/40 h-px flex-1" />
                                        {week}
                                        <span className="bg-text/40 h-px flex-1" />
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
                                                className="text-text hover:text-text/80 mb-3 flex cursor-pointer items-center gap-2 text-sm font-semibold select-none"
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
                                                <span className="bg-text/50 h-px flex-1" />
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
                                                                        details={
                                                                            true
                                                                        }
                                                                        key={
                                                                            m
                                                                                .meeting
                                                                                .id
                                                                        }
                                                                        meetingResponse={
                                                                            m
                                                                        }
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
