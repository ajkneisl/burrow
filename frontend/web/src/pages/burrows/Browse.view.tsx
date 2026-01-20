import { AnimatePresence, motion } from "framer-motion"
import React, { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import { searchMeetings } from "@features/burrows/burrows.api.ts"
import BurrowHeatmap from "@features/burrows/components/BurrowHeatmap.tsx"
import { Input, useDateRangePicker, ViewErrors } from "@umnburrow/core"
import clsx from "clsx"
import { humanDateLabel, weekRangeLabel } from "@api/util.ts"
import Paginator from "@components/Paginator.tsx"
import { Loader2, ChevronRight, SlidersHorizontal } from "lucide-react"

/**
 * Search through all Burrows.
 *
 * @author AJ Kneisl
 */
export default function Browse() {
    const [query, setQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
    const [showFilters, setShowFilters] = useState(false)
    const [isHost, setIsHost] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isTa, setIsTa] = useState(false)

    const [startDate, endDate, picker] = useDateRangePicker()

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

    // go back to the first page when the search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [query, startDate, endDate, isHost, isBookmarked, isTa])

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: [
            "meetings",
            query,
            currentPage,
            startDate,
            endDate,
            isHost,
            isBookmarked,
            isTa
        ],
        queryFn: async () =>
            await searchMeetings(
                null,
                query || "",
                currentPage,
                startDate as number | undefined,
                endDate as number | undefined,
                isHost,
                isBookmarked,
                isTa
            ),
        refetchOnWindowFocus: false
    })

    const allBurrows: BurrowResponse[] = useMemo(
        () => data?.contents ?? [],
        [data]
    )

    const filtered = useMemo(() => {
        const searchQuery = query.trim().toLowerCase()

        const byDate = allBurrows.filter((m) => {
            return m.burrow.beginningTime >= dayStart
        })

        return byDate
            .filter((meeting) => {
                return (
                    !searchQuery ||
                    meeting.burrow.title.toLowerCase().includes(searchQuery) ||
                    meeting.burrow.description
                        .toLowerCase()
                        .includes(searchQuery) ||
                    meeting.burrow.tags.some((tag) =>
                        tag.toLowerCase().includes(searchQuery)
                    )
                )
            })
            .sort((a, b) => a.burrow.beginningTime - b.burrow.beginningTime)
    }, [allBurrows, query, dayStart])

    const groupedByDate = useMemo(() => {
        const map = new Map<string, BurrowResponse[]>()

        filtered.forEach((m) => {
            const d = new Date(m.burrow.beginningTime)

            d.setHours(0, 0, 0, 0)

            const key = d.toISOString().slice(0, 10)
            const list = map.get(key) ?? []

            list.push(m)
            map.set(key, list)
        })

        const entries = Array.from(map.entries()).sort(([a], [b]) => {
            const aMs = new Date(a).getTime()
            const bMs = new Date(b).getTime()
            return aMs - bMs
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayMs = today.getTime()

        return entries
            .map(([key, list]) => {
                const firstTime =
                    list[0]?.burrow.beginningTime ?? new Date(key).getTime()
                return { key, list, week: weekRangeLabel(firstTime) }
            })
            .filter(({ key }) => {
                const dateMs = new Date(key).getTime()
                return dateMs >= todayMs
            })
    }, [filtered])

    // expand the current week
    useEffect(() => {
        if (groupedByDate.length === 0) return
        const currentWeekLabel = weekRangeLabel(Date.now())
        setExpandedWeeks(new Set([currentWeekLabel]))
    }, [groupedByDate])

    if (error)
        return (
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            </main>
        )

    return (
        <section className="mx-auto w-full max-w-7xl">
            <section className="flex w-full grid-cols-3 flex-col-reverse lg:grid">
                <section className="col-span-2 mx-auto w-full max-w-4xl p-4 sm:p-6">
                    {/* top controls */}
                    <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-text/70 hover:text-text flex cursor-pointer items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </button>
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

                    {/* filter section */}
                    <div className="mb-4">
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-card border-card-border flex flex-wrap gap-4 rounded-lg border p-4">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={isHost}
                                                onClick={() =>
                                                    setIsHost(!isHost)
                                                }
                                                className={clsx(
                                                    "focus:ring-primary/20 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:outline-none",
                                                    isHost
                                                        ? "bg-primary"
                                                        : "bg-text/20"
                                                )}
                                            >
                                                <span
                                                    className={clsx(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        isHost
                                                            ? "translate-x-5"
                                                            : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                            <span className="text-text text-sm font-medium">
                                                Hosting
                                            </span>
                                        </label>

                                        <label className="flex cursor-pointer items-center gap-3">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={isBookmarked}
                                                onClick={() =>
                                                    setIsBookmarked(
                                                        !isBookmarked
                                                    )
                                                }
                                                className={clsx(
                                                    "focus:ring-primary/20 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:outline-none",
                                                    isBookmarked
                                                        ? "bg-primary"
                                                        : "bg-text/20"
                                                )}
                                            >
                                                <span
                                                    className={clsx(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        isBookmarked
                                                            ? "translate-x-5"
                                                            : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                            <span className="text-text text-sm font-medium">
                                                Bookmarked
                                            </span>
                                        </label>

                                        <label className="flex cursor-pointer items-center gap-3">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={isTa}
                                                onClick={() => setIsTa(!isTa)}
                                                className={clsx(
                                                    "focus:ring-info/20 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:outline-none",
                                                    isTa
                                                        ? "bg-info"
                                                        : "bg-text/20"
                                                )}
                                            >
                                                <span
                                                    className={clsx(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        isTa
                                                            ? "translate-x-5"
                                                            : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                            <span className="text-text text-sm font-medium">
                                                TA Hosted
                                            </span>
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {isLoading && !data ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-card border-card-border rounded-2xl border p-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4">
                                        {/* Header row */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-1 flex-col gap-2">
                                                {/* Title skeleton */}
                                                <div className="bg-hero h-5 w-48 animate-pulse rounded" />

                                                {/* Time skeleton */}
                                                <div className="bg-hero h-3 w-32 animate-pulse rounded" />

                                                {/* Description skeleton */}
                                                <div className="mt-2 space-y-1.5">
                                                    <div className="bg-hero h-3 w-full animate-pulse rounded" />
                                                    <div className="bg-hero h-3 w-3/4 animate-pulse rounded" />
                                                </div>
                                            </div>

                                            {/* Profile picture skeleton */}
                                            <div className="bg-hero h-10 w-10 animate-pulse rounded-full" />
                                        </div>

                                        {/* Tags row */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <div className="bg-hero h-6 w-16 animate-pulse rounded-full" />
                                                <div className="bg-hero h-6 w-20 animate-pulse rounded-full" />
                                                <div className="bg-hero hidden h-6 w-14 animate-pulse rounded-full sm:block" />
                                            </div>

                                            <div className="bg-hero h-6 w-24 animate-pulse rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {!isLoading && isFetching ? (
                        <div className="mb-4 text-right">
                            <span className="border-info/30 bg-info/10 text-info inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Updating…
                            </span>
                        </div>
                    ) : null}

                    {/* no search results */}
                    {!isLoading && groupedByDate.length === 0 && (
                        <div className="border-primary/20 bg-card text-text rounded-2xl border p-6 shadow-sm">
                            <p className="text-sm font-medium">
                                No meetings match your filters.
                            </p>
                            <p className="text-text/70 mt-1 text-xs">
                                Try adjusting your search or picking a different
                                date.
                            </p>
                        </div>
                    )}

                    {/* search results */}
                    {!isLoading && groupedByDate.length >= 0 && (
                        <>
                            <div className="space-y-10">
                                {groupedByDate.map(
                                    (
                                        { key: dateKey, list: meetings, week },
                                        idx
                                    ) => {
                                        const isFirstOfWeek =
                                            idx === 0 ||
                                            groupedByDate[idx - 1].week !== week
                                        const isExpanded =
                                            expandedWeeks.has(week)

                                        return (
                                            <React.Fragment key={dateKey}>
                                                {isFirstOfWeek && (
                                                    <button
                                                        onClick={() =>
                                                            toggleWeek(week)
                                                        }
                                                        className="group text-text/60 hover:text-text mb-6 flex w-full cursor-pointer items-center gap-3 text-xs font-semibold tracking-wider uppercase transition-colors"
                                                        aria-expanded={
                                                            isExpanded
                                                        }
                                                    >
                                                        <ChevronRight
                                                            className={clsx(
                                                                "h-4 w-4 transition-transform duration-200",
                                                                isExpanded
                                                                    ? "rotate-90"
                                                                    : "rotate-0"
                                                            )}
                                                        />
                                                        <span>{week}</span>
                                                        <span className="bg-text/20 h-px flex-1" />
                                                    </button>
                                                )}

                                                {/* Day section */}
                                                <AnimatePresence
                                                    initial={false}
                                                >
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
                                                                {meetings.map(
                                                                    (m) => (
                                                                        <BurrowCard
                                                                            details={
                                                                                true
                                                                            }
                                                                            key={
                                                                                m
                                                                                    .burrow
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
                                            </React.Fragment>
                                        )
                                    }
                                )}
                            </div>

                            {/* Pagination controls */}
                            {data && (
                                <Paginator
                                    currentPage={currentPage}
                                    totalPages={data.totalPages}
                                    totalResults={data.totalResults}
                                    onPageChange={setCurrentPage}
                                    isLoading={isFetching}
                                />
                            )}
                        </>
                    )}
                </section>

                <aside className="col-span-1 mt-5 lg:max-w-sm">
                    <BurrowHeatmap />
                </aside>
            </section>
        </section>
    )
}
