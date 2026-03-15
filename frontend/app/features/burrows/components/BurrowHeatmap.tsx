import { View, ScrollView, Pressable, Dimensions } from "react-native"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getBurrowHeatmap } from "../burrows.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import { themeColors } from "@api/theme/theme.types"
import { Card, Text } from "@components/core"
import { Calendar } from "lucide-react-native"

type HeatmapData = Record<string, Record<number, number>>

type DayData = {
    date: Date
    inMonth: boolean
    day?: number
    count: number
}

type WeekData = {
    days: DayData[]
}

type MonthData = {
    key: string
    label: { monthName: string; year: number }
    weeks: WeekData[]
    max: number
}

/**
 * Find the intensity color based on burrow count.
 */
function getIntensityColor(value: number, max: number, colors: typeof themeColors.light): string {
    if (!value) return colors.card
    if (max <= 1) return colors.secondary

    const q1 = Math.max(1, Math.ceil(max * 0.25))
    const q2 = Math.max(2, Math.ceil(max * 0.5))
    const q3 = Math.max(3, Math.ceil(max * 0.75))

    if (value <= q1) return `${colors.secondary}33` // 20% opacity
    if (value <= q2) return `${colors.secondary}66` // 40% opacity
    if (value <= q3) return `${colors.secondary}99` // 60% opacity

    return colors.secondary
}

/**
 * Parse a YYYY-MM key into year and month.
 */
function parseMonthKey(key: string): { year: number; month: number } {
    const [y, m] = key.split("-").map((v) => parseInt(v, 10))
    return { year: y, month: m - 1 } // month is 0-indexed
}

/**
 * Mobile-optimized burrow heatmap component.
 * Shows burrow activity by day in a calendar grid format.
 */
export function BurrowHeatmap({ range = 3 }: { range?: number }) {
    const colors = useThemeColors()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const { data, isLoading } = useQuery<HeatmapData>({
        queryKey: ["burrows", "heatmap", range],
        queryFn: () => getBurrowHeatmap(range)
    })

    const months = useMemo<MonthData[]>(() => {
        if (!data) return []

        const monthKeys = Object.keys(data).sort()

        return monthKeys.map((key) => {
            const { year, month } = parseMonthKey(key)
            const first = new Date(year, month, 1)
            first.setHours(0, 0, 0, 0)

            const last = new Date(year, month + 1, 0)
            last.setHours(23, 59, 59, 999)

            // Find the start of the first week (Sunday)
            const firstWeekStart = new Date(first)
            firstWeekStart.setDate(first.getDate() - first.getDay())
            firstWeekStart.setHours(0, 0, 0, 0)

            // Find the end of the last week (Saturday)
            const lastWeekEnd = new Date(last)
            lastWeekEnd.setDate(last.getDate() + (6 - last.getDay()))
            lastWeekEnd.setHours(23, 59, 59, 999)

            const counts = data[key] ?? {}

            // Build weeks
            const weeks: WeekData[] = []
            const cur = new Date(firstWeekStart)

            while (cur <= lastWeekEnd) {
                const weekStart = new Date(cur)
                const days: DayData[] = []

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

            const label = {
                monthName: first.toLocaleString(undefined, { month: "long" }),
                year: first.getFullYear()
            }

            const max = Object.values(counts).reduce((m, v) => (v > m ? v : m), 0)

            return { key, label, weeks, max }
        })
    }, [data])

    const screenWidth = Dimensions.get("window").width
    const cellSize = Math.floor((screenWidth - 80) / 8) // Account for padding and spacing

    if (isLoading) {
        return (
            <Card variant="bordered">
                <View className="items-center justify-center py-12">
                    <Calendar size={48} color={colors.text} style={{ opacity: 0.2 }} />
                    <Text className="text-text text-opacity-60 mt-4">
                        Loading heatmap...
                    </Text>
                </View>
            </Card>
        )
    }

    if (!data || months.length === 0) {
        return (
            <Card variant="bordered">
                <View className="items-center justify-center py-12">
                    <Calendar size={48} color={colors.text} style={{ opacity: 0.2 }} />
                    <Text className="text-text text-opacity-60 mt-4">
                        No data available
                    </Text>
                </View>
            </Card>
        )
    }

    return (
        <Card variant="bordered">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
            >
                {months.map((m) => (
                    <View key={m.key} className="mr-6">
                        {/* Month Label */}
                        <Text className="text-text font-semibold text-center mb-3">
                            {m.label.monthName} {m.label.year}
                        </Text>

                        {/* Day Labels */}
                        <View className="flex-row mb-2">
                            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                <View
                                    key={i}
                                    style={{ width: cellSize, height: cellSize }}
                                    className="items-center justify-center"
                                >
                                    <Text
                                        className="text-text text-opacity-50 text-xs"
                                        style={{ fontSize: 10 }}
                                    >
                                        {day}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View>
                            {m.weeks.map((week, wi) => (
                                <View key={`week-${wi}`} className="flex-row mb-1">
                                    {week.days.map((day, di) => {
                                        if (!day.inMonth) {
                                            return (
                                                <View
                                                    key={`empty-${di}`}
                                                    style={{
                                                        width: cellSize,
                                                        height: cellSize,
                                                        margin: 1
                                                    }}
                                                    className="bg-background rounded-sm"
                                                />
                                            )
                                        }

                                        const color = getIntensityColor(
                                            day.count,
                                            m.max,
                                            colors
                                        )

                                        return (
                                            <Pressable
                                                key={`day-${di}`}
                                                onPress={() => setSelectedDate(day.date)}
                                                style={{
                                                    width: cellSize,
                                                    height: cellSize,
                                                    margin: 1,
                                                    backgroundColor: color
                                                }}
                                                className="rounded-sm items-center justify-center"
                                            >
                                                {day.count > 0 && cellSize > 24 && (
                                                    <Text
                                                        className="text-white font-semibold"
                                                        style={{ fontSize: 10 }}
                                                    >
                                                        {day.count}
                                                    </Text>
                                                )}
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Legend */}
            <View className="flex-row items-center justify-center gap-2 mt-4 pt-4 border-t border-card-border">
                <Text className="text-text text-opacity-60 text-xs">Less</Text>
                <View
                    style={{ width: 16, height: 16 }}
                    className="rounded-sm"
                    backgroundColor={colors.card}
                />
                <View
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: `${colors.secondary}33`
                    }}
                    className="rounded-sm"
                />
                <View
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: `${colors.secondary}66`
                    }}
                    className="rounded-sm"
                />
                <View
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: `${colors.secondary}99`
                    }}
                    className="rounded-sm"
                />
                <View
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: colors.secondary
                    }}
                    className="rounded-sm"
                />
                <Text className="text-text text-opacity-60 text-xs">More</Text>
            </View>

            {/* Selected Date Info */}
            {selectedDate && (
                <View className="mt-4 pt-4 border-t border-card-border">
                    <Text className="text-text text-center font-semibold">
                        {selectedDate.toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        })}
                    </Text>
                    <Pressable onPress={() => setSelectedDate(null)} className="mt-2">
                        <Text className="text-primary text-center text-sm">
                            Close
                        </Text>
                    </Pressable>
                </View>
            )}
        </Card>
    )
}
