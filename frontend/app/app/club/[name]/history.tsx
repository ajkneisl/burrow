import { getClubHistory, humanDateLabel } from "@umnburrow/core/api"
import type { BurrowResponse } from "@umnburrow/core/api"
import { useMemo, useState, useCallback } from "react"
import { View, SectionList, RefreshControl } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { Calendar, ChevronLeft, ChevronRight, Lock } from "lucide-react-native"

import useClubRole from "@features/clubs/hooks/useClubRole"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"

import { Button, Skeleton, Text } from "@components/core"
import { useClubContext } from "./_layout"

/**
 * A club's Burrow history. Moderators and administrators only.
 *
 * @author AJ Kneisl
 */
export default function ClubHistoryTab() {
    const { name, colors } = useClubContext()
    const { isMod } = useClubRole(name)
    const [currentPage, setCurrentPage] = useState(1)

    const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
        queryKey: ["clubHistory", name, currentPage],
        enabled: !!name && isMod,
        queryFn: async () => await getClubHistory(name, currentPage),
        refetchOnWindowFocus: false
    })

    const allBurrows: BurrowResponse[] = useMemo(
        () => data?.contents ?? [],
        [data]
    )

    // Group burrows by their date
    const groupedByDate = useMemo(() => {
        const map = new Map<string, BurrowResponse[]>()

        allBurrows.forEach((burrow) => {
            const burrowDate = new Date(burrow.burrow.endTime)
            const key = burrowDate.toISOString().slice(0, 10)
            const list = map.get(key) ?? []

            list.push(burrow)
            map.set(key, list)
        })

        // Sort entries (newest first)
        const entries = Array.from(map.entries()).sort(([a], [b]) => {
            const aMs = new Date(a).getTime()
            const bMs = new Date(b).getTime()
            return bMs - aMs
        })

        return entries.map(([key, data]) => ({
            title: humanDateLabel(key),
            data
        }))
    }, [allBurrows])

    const renderSectionHeader = useCallback(
        ({ section }: { section: { title: string } }) => (
            <View className="bg-background flex-row items-center gap-3 mb-4 mt-6 first:mt-0">
                <Text className="text-base font-semibold text-text">
                    {section.title}
                </Text>
                <View className="flex-1 h-px bg-card-border" />
            </View>
        ),
        []
    )

    const renderItem = useCallback(
        ({ item }: { item: BurrowResponse }) => (
            <UpcomingBurrowCard burrowResponse={item} verbose />
        ),
        []
    )

    if (!isMod) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-6">
                <Lock size={48} color={colors.text} style={{ opacity: 0.2 }} />

                <Text className="text-text opacity-60 text-lg mt-4">
                    History is restricted
                </Text>

                <Text className="text-text opacity-40 text-sm mt-1 text-center">
                    Only moderators and administrators can view this club&apos;s
                    history.
                </Text>
            </View>
        )
    }

    if (isError) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-6">
                <Text className="text-error text-base font-medium">
                    Failed to load history
                </Text>

                <Text className="text-text opacity-60 text-sm mt-2">
                    {String(error)}
                </Text>

                <Button
                    variant="outline"
                    className="mt-4"
                    onPress={() => void refetch()}
                >
                    Retry
                </Button>
            </View>
        )
    }

    if (isLoading) {
        return (
            <View className="flex-1 bg-background px-6 pt-6 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
            </View>
        )
    }

    if (groupedByDate.length === 0) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-6">
                <Calendar size={48} color={colors.text} style={{ opacity: 0.2 }} />

                <Text className="text-text opacity-60 text-lg mt-4">
                    No Burrows yet
                </Text>

                <Text className="text-text opacity-40 text-sm mt-1">
                    This club hasn&apos;t held any Burrows.
                </Text>
            </View>
        )
    }

    const totalPages = data?.totalPages ?? 1

    return (
        <View className="flex-1 bg-background">
            <SectionList
                sections={groupedByDate}
                keyExtractor={(item) => item.burrow.id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: 100
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={() => void refetch()}
                        tintColor={colors.primary}
                    />
                }
                ListFooterComponent={
                    totalPages > 1 ? (
                        <View className="flex-row items-center justify-between gap-3 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1 || isFetching}
                                leftIcon={
                                    <ChevronLeft size={16} color={colors.text} />
                                }
                                onPress={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1)
                                    )
                                }
                            >
                                Previous
                            </Button>

                            <Text className="text-text opacity-60 text-xs">
                                Page {currentPage} of {totalPages}
                            </Text>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages || isFetching}
                                rightIcon={
                                    <ChevronRight
                                        size={16}
                                        color={colors.text}
                                    />
                                }
                                onPress={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1)
                                    )
                                }
                            >
                                Next
                            </Button>
                        </View>
                    ) : null
                }
            />
        </View>
    )
}
