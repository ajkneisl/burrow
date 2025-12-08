import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, Hover } from "@umnburrow/core"
import clsx from "clsx"
import { get } from "@api/api.ts"

type MonthCounts = Record<number, number>
type HeatmapData = Record<string, MonthCounts> // { "YYYY-MM": { day: count } }

/**
 * Get the name of the month and the current year.
 *
 * @param date The current date.
 */
function monthMeta(date = new Date()) {
    const tz = "America/Chicago"

    // first day of current month
    const first = new Date(date.toLocaleString("en-US", { timeZone: tz }))
    first.setHours(0, 0, 0, 0)
    first.setDate(1)

    const monthName = first.toLocaleString(undefined, { month: "long" })
    const year = first.getFullYear()

    return { monthName, year }
}

/**
 * Find the intensity class depending on how many Burrows were published on a day.
 *
 * @param value How many Burrows were published.
 * @param max The highest amount of Burrows published in a month.
 */
function findClass(value: number, max: number): string {
    if (!value) return "bg-background/70"
    if (max <= 1) return "bg-secondary"

    const q1 = Math.max(1, Math.ceil(max * 0.25))
    const q2 = Math.max(2, Math.ceil(max * 0.5))
    const q3 = Math.max(3, Math.ceil(max * 0.75))

    if (value <= q1) return "bg-secondary/20"
    if (value <= q2) return "bg-secondary/40"
    if (value <= q3) return "bg-secondary/60"

    return "bg-secondary"
}

/**
 * Parse a yyyy-mm into numbers.
 *
 * @param key The yyyy-mm string.
 */
function parseMonthKey(key: string): { year: number; month: number } {
    const [y, m] = key.split("-").map((v) => parseInt(v, 10))
    return { year: y, month: m }
}

/**
 * Find the first date of a month.
 *
 * @param year The year.
 * @param month The month.
 */
function monthFirstDate(year: number, month: number): Date {
    const tz = "America/Chicago"
    const base = new Date(Date.UTC(year, month, 1))
    const first = new Date(base.toLocaleString("en-US", { timeZone: tz }))
    first.setHours(0, 0, 0, 0)
    first.setDate(1)
    return first
}

/**
 * Find the label of a month from the date.
 * @param date The date object.
 */
function monthLabel(date: Date): { monthName: string; year: number } {
    return {
        monthName: date.toLocaleString(undefined, { month: "long" }),
        year: date.getFullYear()
    }
}

/**
 * A heatmap of how many Burrows were made on what day.
 * @constructor
 */
export default function BurrowHeatmap({
    range = 1,
    onSelectDate
}: {
    range?: number
    onSelectDate?: (date: Date) => void
}) {
    const { monthName, year } = useMemo(() => monthMeta(new Date()), [])

    // request for the heatmap data
    const { data, isLoading, error } = useQuery<HeatmapData>({
        queryKey: ["groups", "heatmap", monthName, year, range],
        queryFn: async () => await get("/burrows/heatmap", { query: { range } })
    })

    const monthKeys = useMemo(() => {
        if (data && Object.keys(data).length > 0) {
            return Object.keys(data).sort()
        }

        const now = new Date()
        const y = now.getFullYear()
        const m = now.getMonth() + 1
        const keys: string[] = []
        for (let i = 0; i < range; i++) {
            const dt = new Date(y, m - 1 + i, 1)
            keys.push(
                `${dt.getFullYear().toString().padStart(4, "0")}-${(
                    dt.getMonth() + 1
                )
                    .toString()
                    .padStart(2, "0")}`
            )
        }
        return keys
    }, [data, range])

    const months = useMemo(() => {
        return monthKeys.map((key) => {
            const { year, month } = parseMonthKey(key)
            const first = monthFirstDate(year, month)

            const last = new Date(first)
            last.setMonth(first.getMonth() + 1)
            last.setDate(0)
            last.setHours(23, 59, 59, 999)

            const firstWeekStart = new Date(first)
            firstWeekStart.setDate(first.getDate() - first.getDay())
            firstWeekStart.setHours(0, 0, 0, 0)

            const lastWeekEnd = new Date(last)
            lastWeekEnd.setDate(last.getDate() + (6 - last.getDay()))
            lastWeekEnd.setHours(23, 59, 59, 999)

            const counts = data?.[key] ?? {}

            const weeks: {
                days: {
                    date: Date
                    inMonth: boolean
                    day?: number
                    count: number
                }[]
            }[] = []
            const cur = new Date(firstWeekStart)
            while (cur <= lastWeekEnd) {
                const weekStart = new Date(cur)
                const days: {
                    date: Date
                    inMonth: boolean
                    day?: number
                    count: number
                }[] = []
                for (let d = 0; d < 7; d++) {
                    const dayDate = new Date(weekStart)
                    dayDate.setDate(weekStart.getDate() + d)
                    dayDate.setHours(0, 0, 0, 0)

                    const inMonth = dayDate.getMonth() === first.getMonth()
                    const day = inMonth ? dayDate.getDate() : undefined
                    const count = inMonth && day ? (counts[day] ?? 0) : 0
                    days.push({ date: dayDate, inMonth, day, count })
                }
                weeks.push({ days })
                cur.setDate(cur.getDate() + 7)
            }

            const label = monthLabel(first)
            const max = Object.values(counts).reduce(
                (m, v) => (v > m ? v : m),
                0
            )
            return { key, first, weeks, counts, label, max }
        })
    }, [data, monthKeys])

    return (
        <Card className="flex flex-col gap-6">
            <div className="flex flex-row justify-evenly gap-6 lg:flex-col">
                {months.map((m) => (
                    <div
                        key={m.key}
                        className="flex flex-col items-center gap-3"
                    >
                        <h3 className="text-lg font-semibold">
                            {m.label.monthName} {m.label.year}
                        </h3>

                        <div className="flex items-start gap-4">
                            {isLoading ? (
                                <div
                                    className="grid gap-1"
                                    style={{
                                        gridTemplateRows: `repeat(${m.weeks.length}, 1rem)`
                                    }}
                                >
                                    {m.weeks.map((week, wi) => (
                                        <div
                                            key={`loading-${m.key}-${wi}`}
                                            className="grid grid-cols-7 gap-1"
                                        >
                                            {week.days.map((day, di) => (
                                                <div
                                                    key={`loading-day-${di}`}
                                                    className={clsx(
                                                        "h-4 w-4 rounded-sm",
                                                        day.inMonth
                                                            ? "bg-background animate-pulse"
                                                            : "bg-base-300"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className="grid gap-1"
                                    style={{
                                        gridTemplateRows: `repeat(${m.weeks.length}, 1rem)`
                                    }}
                                >
                                    {m.weeks.map((week, wi) => (
                                        <div
                                            key={`week-${m.key}-${wi}`}
                                            className="grid grid-cols-7 gap-1"
                                        >
                                            {week.days.map((day, di) => {
                                                if (!day.inMonth) {
                                                    return (
                                                        <div
                                                            key={`empty-${di}`}
                                                            className="bg-base-300 h-4 w-4 rounded-sm"
                                                            aria-hidden="true"
                                                        />
                                                    )
                                                }

                                                const colorClass = findClass(
                                                    day.count,
                                                    m.max
                                                )
                                                const tooltipText = `${day.count} Burrow${day.count === 1 ? "" : "s"} on ${m.label.monthName} ${day.day}`

                                                return (
                                                    <Hover
                                                        key={`day-${di}`}
                                                        content={tooltipText}
                                                    >
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() =>
                                                                onSelectDate?.(
                                                                    day.date
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                        "Enter" ||
                                                                    e.key ===
                                                                        " "
                                                                ) {
                                                                    e.preventDefault()
                                                                    onSelectDate?.(
                                                                        day.date
                                                                    )
                                                                }
                                                            }}
                                                            className={clsx(
                                                                "h-4 w-4 cursor-pointer rounded-sm",
                                                                "focus:ring-secondary/60 focus:ring-2 focus:outline-none",
                                                                colorClass
                                                            )}
                                                            aria-label={
                                                                tooltipText
                                                            }
                                                        />
                                                    </Hover>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {error && (
                    <div className="text-error text-sm">
                        Failed to load heatmap.
                    </div>
                )}
            </div>

            {/* legend */}
            <div className="text-text/70 flex flex-row gap-2 self-center text-xs">
                <span>More</span>
                <div
                    role="button"
                    tabIndex={0}
                    className={clsx(
                        "h-4 w-4 cursor-pointer rounded-sm",
                        "focus:ring-secondary/60 bg-secondary focus:ring-2 focus:outline-none"
                    )}
                />
                <div
                    role="button"
                    tabIndex={0}
                    className={clsx(
                        "h-4 w-4 cursor-pointer rounded-sm",
                        "focus:ring-secondary/60 bg-secondary/60 focus:ring-2 focus:outline-none"
                    )}
                />
                <div
                    role="button"
                    tabIndex={0}
                    className={clsx(
                        "h-4 w-4 cursor-pointer rounded-sm",
                        "focus:ring-secondary/60 bg-secondary/40 focus:ring-2 focus:outline-none"
                    )}
                />
                <div
                    role="button"
                    tabIndex={0}
                    className={clsx(
                        "h-4 w-4 cursor-pointer rounded-sm",
                        "focus:ring-secondary/60 bg-secondary/20 focus:ring-2 focus:outline-none"
                    )}
                />
                <span>Less</span>
            </div>
        </Card>
    )
}
