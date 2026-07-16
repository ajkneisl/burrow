import { View, ScrollView, RefreshControl } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Clock, Archive } from "lucide-react-native"
import { Button, Chip, Text } from "@components/core"
import { dayLabel } from "@api/util"
import ThemedIcon from "@components/core/ThemedIcon"
import BurrowDetails from "@features/burrows/attendees/BurrowDetails"
import { Pomodoro } from "@features/sync/components/Pomodoro"
import { useBurrowContext } from "@features/burrows/context/burrows.context"
import { useThemeColors } from "@api/theme/useThemeColors"

export default function AboutTab() {
    const colors = useThemeColors()
    const {
        data,
        isHostOrMod,
        isPast,
        isProject,
        blocks,
        leaveMutation,
        id
    } = useBurrowContext()
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
                {/* project status */}
                {isProject && (
                    <View
                        className="rounded-2xl p-4"
                        style={{
                            backgroundColor: isPast
                                ? `${colors.error}15`
                                : `${colors.success}15`,
                            borderWidth: 1,
                            borderColor: isPast
                                ? `${colors.error}30`
                                : `${colors.success}30`
                        }}
                    >
                        <View className="flex-row items-center gap-3">
                            <View
                                className="rounded-full p-2"
                                style={{
                                    backgroundColor: isPast
                                        ? `${colors.error}25`
                                        : `${colors.success}25`
                                }}
                            >
                                <ThemedIcon
                                    size={18}
                                    icon={Clock}
                                    overrideColor={isPast ? "error" : "success"}
                                />
                            </View>

                            <View>
                                <Text
                                    className="font-bold text-base"
                                    style={{
                                        color: isPast
                                            ? colors.error
                                            : colors.success
                                    }}
                                >
                                    {isPast ? "Overdue" : "In Progress"}
                                </Text>

                                {isPast && (
                                    <Text className="text-text text-opacity-70 text-sm">
                                        Due {dayLabel(burrow.endTime)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* details */}
                <BurrowDetails burrowResponse={data} />

                {/* description */}
                {burrow.description && (
                    <>
                        <View className="border-t border-card-border" />

                        <View>
                            <Text className="text-xs text-text text-opacity-50 uppercase tracking-wide mb-1">
                                {isProject ? "Objective" : "Description"}
                            </Text>
                            <Text className="text-text text-opacity-80 leading-6">
                                {burrow.description}
                            </Text>
                        </View>
                    </>
                )}

                {/* tags */}
                {burrow.tags && burrow.tags.length > 0 && (
                    <>
                        <View className="border-t border-card-border" />

                        <View className="flex-row flex-wrap gap-2">
                            {burrow.tags.map((tag: string) => (
                                <Chip
                                    key={tag}
                                    size="sm"
                                    label={tag}
                                />
                            ))}
                        </View>
                    </>
                )}

                {/* pomodoro */}
                {blocks.includes("POMODORO") && data.membership && (
                    <Pomodoro burrowId={id} userRole={data.membership.role} />
                )}

                {/* leave burrow */}
                {!isHostOrMod && !isPast && (
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        leftIcon={<Archive size={18} color={colors.text} />}
                        onPress={() => leaveMutation.mutate()}
                        loading={leaveMutation.isPending}
                    >
                        {isProject ? "Leave Project" : "Leave Burrow"}
                    </Button>
                )}

                <View className="h-4" />
            </View>
        </ScrollView>
    )
}
