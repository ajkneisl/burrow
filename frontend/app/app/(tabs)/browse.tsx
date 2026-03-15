import {
    View,
    Text,
    SectionList,
    RefreshControl,
    Pressable
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Header } from "@features/layout/components"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"
import { getBurrows, searchMeetings } from "@features/burrows/burrows.api"
import type {
    BurrowKind,
    BurrowResponse
} from "@features/burrows/burrows.types"
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Map as MapIcon
} from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    CustomDateTimePicker,
    FilterChip,
    LabeledSwitch
} from "@components/core"
import { humanDateLabel, weekRangeLabel } from "@api/util"
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue
} from "react-native-reanimated"
import { useAtom } from "jotai"
import { mapModalOpen } from "@features/layout/layout.atom"

/**
 * {@link BrowseScreen}
 */
type GroupedSection = {
    week: string
    dayKey: string
    title: string
    data: BurrowResponse[]
    isFirstOfWeek: boolean
}

/**
 * Browse screen
 *
 * @author AJ Kneisl
 */
export default function BrowseScreen() {
    const colors = useThemeColors()
    const [, setMapOpen] = useAtom(mapModalOpen)

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())

    // search filters
    const [selectedType, setSelectedType] = useState<BurrowKind | null>(null)
    const [isHost, setIsHost] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    const hasAdvancedFilters = isHost || isBookmarked || startDate || endDate

    const { data, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: [
            "burrows",
            "browse",
            selectedType,
            isHost,
            isBookmarked,
            startDate?.getTime(),
            endDate?.getTime()
        ],
        queryFn: async () => {
            if (hasAdvancedFilters) {
                return await searchMeetings(
                    selectedType,
                    "",
                    1,
                    startDate?.getTime(),
                    endDate?.getTime(),
                    isHost || undefined,
                    isBookmarked || undefined
                )
            }

            return await getBurrows(selectedType)
        }
    })

    // Group burrows by date
    const groupedSections = useMemo(() => {
        const burrows = data?.contents ?? []
        if (burrows.length === 0) return []

        // Group by date
        const byDate = new Map<string, BurrowResponse[]>()
        burrows.forEach((b) => {
            const d = new Date(b.burrow.beginningTime)
            d.setHours(0, 0, 0, 0)
            const key = d.toISOString().slice(0, 10)
            const list = byDate.get(key) ?? []
            list.push(b)
            byDate.set(key, list)
        })

        // Sort by date and create sections
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayMs = today.getTime()

        const entries = Array.from(byDate.entries())
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .filter(([key]) => new Date(key).getTime() >= todayMs)

        const sections: GroupedSection[] = []
        let lastWeek = ""

        entries.forEach(([dayKey, burrows]) => {
            const firstTime =
                burrows[0]?.burrow.beginningTime ?? new Date(dayKey).getTime()
            const week = weekRangeLabel(firstTime)
            const isFirstOfWeek = week !== lastWeek
            lastWeek = week

            sections.push({
                week,
                dayKey,
                title: humanDateLabel(dayKey),
                data: burrows.sort(
                    (a, b) => a.burrow.beginningTime - b.burrow.beginningTime
                ),
                isFirstOfWeek
            })
        })

        return sections
    }, [data])

    useEffect(() => {
        if (groupedSections.length > 0) {
            const currentWeek = weekRangeLabel(Date.now())
            setExpandedWeeks(new Set([currentWeek]))
        }
    }, [groupedSections.length])

    const toggleWeek = (week: string) => {
        setExpandedWeeks((prev) => {
            const next = new Set(prev)
            if (next.has(week)) next.delete(week)
            else next.add(week)
            return next
        })
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header
                title="Browse"
                leftActions={
                    <Pressable
                        onPress={() => setMapOpen(true)}
                        className="p-2 rounded-lg active:bg-card dark:active:bg-card"
                    >
                        <MapIcon size={24} color={colors.text} />
                    </Pressable>
                }
            />

            {/* all filters */}
            <View className="border-b border-card-border">
                {/* different types*/}
                <View className="px-6 py-3">
                    <View className="flex-row gap-2 flex-wrap">
                        {/* filter chips */}
                        <FilterChip
                            label="All"
                            active={selectedType === null}
                            onPress={() => setSelectedType(null)}
                        />

                        <FilterChip
                            label="Study"
                            active={selectedType === "STUDY"}
                            onPress={() => setSelectedType("STUDY")}
                        />

                        <FilterChip
                            label="Event"
                            active={selectedType === "EVENT"}
                            onPress={() => setSelectedType("EVENT")}
                        />

                        <FilterChip
                            label="Club"
                            active={selectedType === "CLUB"}
                            onPress={() => setSelectedType("CLUB")}
                        />

                        {/* more filters */}
                        <Pressable
                            onPress={() =>
                                setShowAdvancedFilters(!showAdvancedFilters)
                            }
                            className={`px-4 py-2 rounded-full flex-row items-center gap-1 ${
                                hasAdvancedFilters ? "bg-primary" : "bg-card"
                            }`}
                        >
                            <Filter
                                size={14}
                                color={
                                    hasAdvancedFilters ? "#FFFFFF" : colors.text
                                }
                            />

                            <Text
                                className={`text-sm font-semibold ${
                                    hasAdvancedFilters
                                        ? "text-white"
                                        : "text-text"
                                }`}
                            >
                                More
                            </Text>

                            {showAdvancedFilters ? (
                                <ChevronUp
                                    size={14}
                                    color={
                                        hasAdvancedFilters
                                            ? "#FFFFFF"
                                            : colors.text
                                    }
                                />
                            ) : (
                                <ChevronDown
                                    size={14}
                                    color={
                                        hasAdvancedFilters
                                            ? "#FFFFFF"
                                            : colors.text
                                    }
                                />
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* advanced */}
                {showAdvancedFilters && (
                    <View className="mx-4 mb-4 p-4 bg-card rounded-xl border border-card-border gap-5">
                        <View className="gap-3">
                            <Text className="text-xs font-semibold text-text uppercase tracking-wider">
                                Show Only
                            </Text>

                            <View className="flex-row gap-4">
                                <LabeledSwitch
                                    label="My Hosted"
                                    value={isHost}
                                    onValueChange={setIsHost}
                                />

                                <LabeledSwitch
                                    label="Bookmarked"
                                    value={isBookmarked}
                                    onValueChange={setIsBookmarked}
                                />
                            </View>
                        </View>

                        <View className="h-px bg-card-border" />

                        <View className="gap-3">
                            <Text className="text-xs font-semibold text-text uppercase tracking-wider">
                                Date Range
                            </Text>

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <CustomDateTimePicker
                                        mode="date"
                                        value={startDate ?? null}
                                        onChange={setStartDate}
                                        placeholder="Start date"
                                    />
                                </View>

                                <View className="flex-1">
                                    <CustomDateTimePicker
                                        mode="date"
                                        value={endDate ?? null}
                                        onChange={setEndDate}
                                        placeholder="End date"
                                    />
                                </View>
                            </View>
                        </View>

                        {hasAdvancedFilters && (
                            <>
                                <View className="h-px bg-card-border" />

                                <Pressable
                                    onPress={() => {
                                        setIsHost(false)
                                        setIsBookmarked(false)
                                        setStartDate(undefined)
                                        setEndDate(undefined)
                                    }}
                                    className="bg-error/10 py-2.5 rounded-lg border border-error/20"
                                >
                                    <Text className="text-error text-sm font-semibold text-center">
                                        Clear Filters
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* burrow list grouped by date */}
            <SectionList
                sections={groupedSections}
                keyExtractor={(item) => item.burrow.id}
                renderItem={({ item, section }) => {
                    const isExpanded = expandedWeeks.has(section.week)
                    if (!isExpanded) return null
                    return <UpcomingBurrowCard burrowResponse={item} verbose />
                }}
                renderSectionHeader={({ section }) => (
                    <SectionHeader
                        section={section}
                        isExpanded={expandedWeeks.has(section.week)}
                        onToggleWeek={toggleWeek}
                        colors={colors}
                    />
                )}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                stickySectionHeadersEnabled={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-12">
                        {isLoading ? (
                            <Text className="text-text text-opacity-60">
                                Loading Burrows...
                            </Text>
                        ) : isError ? (
                            <View className="items-center">
                                <Text className="text-text text-opacity-60 mb-4">
                                    Failed to load Burrows
                                </Text>

                                <Pressable
                                    onPress={() => refetch()}
                                    className="bg-primary px-4 py-2 rounded-lg"
                                >
                                    <Text className="text-white font-semibold">
                                        Retry
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View className="items-center">
                                <Search
                                    size={48}
                                    color={colors.text}
                                    style={{ opacity: 0.2 }}
                                />

                                <Text className="text-text text-opacity-60 mt-4">
                                    No Burrows found
                                </Text>

                                <Text className="text-text text-opacity-40 text-sm mt-1">
                                    Try changing your filters
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            />

        </SafeAreaView>
    )
}

function SectionHeader({
    section,
    isExpanded,
    onToggleWeek,
    colors
}: {
    section: GroupedSection
    isExpanded: boolean
    onToggleWeek: (week: string) => void
    colors: ReturnType<typeof useThemeColors>
}) {
    const rotation = useSharedValue(isExpanded ? 90 : 0)

    useEffect(() => {
        rotation.value = withTiming(isExpanded ? 90 : 0, { duration: 200 })
    }, [isExpanded, rotation])

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }))

    return (
        <View>
            {/* Week header - only show at start of new week */}
            {section.isFirstOfWeek && (
                <Pressable
                    onPress={() => onToggleWeek(section.week)}
                    className="flex-row items-center gap-2 mb-4 mt-2"
                >
                    <Animated.View style={chevronStyle}>
                        <ChevronRight
                            size={16}
                            color={colors.text}
                            style={{ opacity: 0.6 }}
                        />
                    </Animated.View>

                    <Text className="text-xs font-semibold text-text text-opacity-60 uppercase tracking-wider">
                        {section.week}
                    </Text>

                    <View className="flex-1 h-px bg-text opacity-10" />
                </Pressable>
            )}

            {/* Day label */}
            {isExpanded && (
                <View className="flex-row items-center gap-3 mb-3">
                    <Text className="text-base font-semibold text-text">
                        {section.title}
                    </Text>
                    <View className="flex-1 h-px bg-text opacity-10" />
                </View>
            )}
        </View>
    )
}
