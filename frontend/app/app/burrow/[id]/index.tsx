import { View, ScrollView, RefreshControl } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CircleCheck, Clock } from "lucide-react-native"
import { Card, Chip, Text } from "@components/core"
import { dayLabel } from "@api/util"
import BurrowDetails from "@features/burrows/attendees/BurrowDetails"
import { useBurrowContext } from "@features/burrows/context/burrows.context"
import { useThemeColors } from "@api/theme/useThemeColors"

export default function AboutTab() {
    const colors = useThemeColors()
    const { data, isPast, isProject, id } = useBurrowContext()
    const burrow = data.burrow

    const queryClient = useQueryClient()
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)

        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["burrow", id] }),
                queryClient.invalidateQueries({ queryKey: ["attendees", id] })
            ])
        } finally {
            setRefreshing(false)
        }
    }, [queryClient, id])

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="pb-24"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
            <View className="px-6 pt-4 gap-4">
                {/* details */}
                <Card className="gap-4">
                    {/* project status */}
                    {isProject && (
                        <View className="flex-row">
                            <Chip
                                size="lg"
                                color={isPast ? "error" : "success"}
                                icon={isPast ? Clock : CircleCheck}
                                label={
                                    isPast
                                        ? `Overdue — was due ${dayLabel(burrow.endTime)}`
                                        : "In Progress"
                                }
                            />
                        </View>
                    )}

                    <BurrowDetails burrowResponse={data} />
                </Card>

                {/* description */}
                {burrow.description && (
                    <Card>
                        <Text className="text-xs text-text text-opacity-50 uppercase tracking-wide mb-2">
                            {isProject ? "Objective" : "Description"}
                        </Text>

                        <Text className="text-text text-opacity-80 leading-6">
                            {burrow.description}
                        </Text>
                    </Card>
                )}

                {/* tags */}
                {burrow.tags && burrow.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2">
                        {burrow.tags.map((tag: string) => (
                            <Chip key={tag} size="sm" label={tag} />
                        ))}
                    </View>
                )}

                <View className="h-4" />
            </View>
        </ScrollView>
    )
}
