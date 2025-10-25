import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { BASE_URL } from "@api/util.ts"
import { Card, Hover } from "@umnburrow/core"

type HeatmapData = Record<number, number> // { dayOfMonth: count }

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
 * Find the intensity class depending on how many Burrows were publsihed on a day.
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
 * A heatmap of how many Burrows were made on what day.
 * @constructor
 */
export default function MeetingHeatmap() {
    const token = useToken()

    const { monthName, year } = useMemo(() => monthMeta(new Date()), [])

    // request for the heatmap data
    const { data, isLoading, error } = useQuery<HeatmapData>({
        queryKey: ["groups", "heatmap", monthName, year],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/groups/heatmap`, {
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined
            })
            if (!res.ok) throw new Error("Failed to load heatmap")
            return (await res.json()) as HeatmapData
        }
    })

    // find the calendar display
    const weeks = useMemo(() => {
        const tz = "America/Chicago"
        const first = new Date(
            new Date().toLocaleString("en-US", { timeZone: tz })
        )
        first.setHours(0, 0, 0, 0)
        first.setDate(1)

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
            const weekEnd = new Date(cur)
            weekEnd.setDate(weekStart.getDate() + 6)

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
                const count = inMonth && day ? (data?.[day] ?? 0) : 0
                days.push({ date: dayDate, inMonth, day, count })
            }

            weeks.push({ days })
            // advance by one week
            cur.setDate(cur.getDate() + 7)
        }

        return weeks
    }, [data])

    // find the day with the most burrows
    const max = useMemo(() => {
        if (!data) return 0
        return Object.values(data).reduce((m, v) => (v > m ? v : m), 0)
    }, [data])

    return (
        <Card>
            <div className="flex justify-center items-center flex-col gap-3">
                {/* title */}
                <div className="flex flex-col items-baseline justify-between">
                    <h3 className="text-lg font-semibold">
                        {monthName} {year}
                    </h3>
                </div>

                {/* calendar grid */}
                {isLoading ? (
                    <div
                        className="grid gap-1"
                        style={{
                            gridTemplateRows: `repeat(${weeks.length}, 1rem)`
                        }}
                    >
                        {weeks.map((week, weekIndex) => (
                            <div
                                key={`skeleton-week-${weekIndex}`}
                                className="grid grid-cols-7 gap-1"
                            >
                                {week.days.map((day, dayIndex) => (
                                    <div
                                        key={`skeleton-day-${weekIndex}-${dayIndex}`}
                                        className={`h-4 w-4 rounded-sm ${day.inMonth ? "bg-background animate-pulse" : "bg-base-300"}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        className="grid gap-1"
                        style={{
                            gridTemplateRows: `repeat(${weeks.length}, 1rem)`
                        }}
                    >
                        {weeks.map((week, weekIndex) => (
                            <div
                                key={`wr-${weekIndex}`}
                                className="grid grid-cols-7 gap-1"
                            >
                                {week.days.map((day, dayIndex) => {
                                    if (day.inMonth) {
                                        // class depending on how many burrows
                                        const cls = findClass(day.count, max)

                                        // hover text
                                        const text = `${day.count ?? 0} Burrow${(day.count ?? 0) === 1 ? "" : "s"} on ${monthName} ${day.day}`

                                        return (
                                            <Hover
                                                key={`day-${weekIndex}-${dayIndex}`}
                                                content={text}
                                            >
                                                <div
                                                    className={`h-4 w-4 rounded-sm ${cls}`}
                                                />
                                            </Hover>
                                        )
                                    }

                                    // if the day isn't in the month,
                                    // empty square to maintain shape
                                    // of the month :)
                                    return (
                                        <div
                                            key={`c-${weekIndex}-${dayIndex}`}
                                            className="h-4 w-4 rounded-sm bg-base-300"
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="text-sm text-error">
                        Failed to load heatmap.
                    </div>
                )}
            </div>
        </Card>
    )
}
