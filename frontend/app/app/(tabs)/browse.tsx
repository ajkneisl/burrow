import { View, Text, FlatList, RefreshControl, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Header } from "@features/layout/components"
import { UpcomingBurrowCard } from "@features/home/components/UpcomingBurrowCard"
import { getBurrows, searchMeetings } from "@features/burrows/burrows.api"
import type { BurrowKind, BurrowResponse } from "@features/burrows/burrows.types"
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    CustomDateTimePicker,
    FilterChip,
    LabeledSwitch
} from "@components/core"

/**
 * Browse screen
 *
 * @author AJ Kneisl
 */
export default function BrowseScreen() {
    const colors = useThemeColors()

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

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

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Browse" />

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

                        <FilterChip
                            label="Project"
                            active={selectedType === "PROJECT"}
                            onPress={() => setSelectedType("PROJECT")}
                        />

                        {/* more filters */}
                        <Pressable
                            onPress={() =>
                                setShowAdvancedFilters(!showAdvancedFilters)
                            }
                            className={`px-4 py-2 rounded-full flex-row items-center gap-1 ${
                                hasAdvancedFilters ? "bg-secondary" : "bg-card"
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
                                        : "text-text dark:text-text"
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
                    <View className="px-6 pb-4 space-y-3 gap-3">
                        {/* checkboxes */}
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

                        {/* Date Range */}
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <Text className="text-text text-opacity-60 text-xs mb-1">
                                    Start Date
                                </Text>

                                <CustomDateTimePicker
                                    mode="date"
                                    value={startDate ?? null}
                                    onChange={setStartDate}
                                    placeholder="Select start date"
                                />
                            </View>

                            <View className="flex-1">
                                <Text className="text-text text-opacity-60 text-xs mb-1">
                                    End Date
                                </Text>

                                <CustomDateTimePicker
                                    mode="date"
                                    value={endDate ?? null}
                                    onChange={setEndDate}
                                    placeholder="Select end date"
                                />
                            </View>
                        </View>

                        {/* clear filters */}
                        {hasAdvancedFilters && (
                            <Pressable
                                onPress={() => {
                                    setIsHost(false)
                                    setIsBookmarked(false)
                                    setStartDate(undefined)
                                    setEndDate(undefined)
                                }}
                                className="bg-error/10 px-4 py-2 rounded-lg"
                            >
                                <Text className="text-error text-sm font-semibold text-center">
                                    Clear Advanced Filters
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </View>

            {/* burrow list */}
            <FlatList
                data={data?.contents ?? []}
                keyExtractor={(item: BurrowResponse) => item.burrow.id}
                renderItem={({ item }) => (
                    <UpcomingBurrowCard burrowResponse={item} verbose />
                )}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
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
