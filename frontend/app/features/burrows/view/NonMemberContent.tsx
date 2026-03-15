import { View, ScrollView, RefreshControl } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { Users, Clock, BookOpen, X } from "lucide-react-native"
import { Button, Card, Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import BurrowDetails from "@features/burrows/attendees/BurrowDetails"

type NonMemberContentProps = {
    data: any
    burrow: any
    isProject: boolean
    isPast: boolean
    joinMutation: any
    cancelRequestMutation: any
    id: string
}

export default function NonMemberContent({
    data,
    burrow,
    isProject,
    isPast,
    joinMutation,
    cancelRequestMutation,
    id
}: NonMemberContentProps) {
    const colors = useThemeColors()
    const insets = useSafeAreaInsets()
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
        <>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View className="px-6 gap-4">
                    {/* details */}
                    <Card variant="bordered">
                        <Text className="text-lg font-semibold text-text mb-4">
                            Details
                        </Text>

                        {<BurrowDetails burrowResponse={data} />}
                    </Card>

                    {/* description */}
                    {burrow.description && (
                        <Card variant="bordered">
                            <Text className="text-lg font-semibold text-text mb-3">
                                {isProject ? "Objective" : "Description"}
                            </Text>

                            <Text className="text-text text-opacity-80 leading-6">
                                {burrow.description}
                            </Text>
                        </Card>
                    )}

                    {/* tags */}
                    {burrow.tags && burrow.tags.length > 0 && (
                        <Card variant="bordered" className="mt-2">
                            <Text className="text-lg font-semibold text-text mb-3">
                                Tags
                            </Text>

                            <View className="flex-row flex-wrap gap-2">
                                {burrow.tags.map(
                                    (tag: string, index: number) => (
                                        <View
                                            key={index}
                                            className="bg-background border-card-border border px-2 py-1 rounded-full"
                                        >
                                            <Text className="text-sm text-text dark:text-text">
                                                {tag}
                                            </Text>
                                        </View>
                                    )
                                )}
                            </View>
                        </Card>
                    )}

                    {/* Request to Join Notice */}
                    {burrow.requestToJoin && !data?.requestedToJoin && (
                        <View
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: `${colors.info}15`,
                                borderWidth: 1,
                                borderColor: `${colors.info}30`
                            }}
                        >
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="rounded-full p-2.5"
                                    style={{
                                        backgroundColor: `${colors.info}25`
                                    }}
                                >
                                    <BookOpen size={20} color={colors.info} />
                                </View>

                                <View className="flex-1">
                                    <Text
                                        className="font-bold text-base mb-0.5"
                                        style={{ color: colors.info }}
                                    >
                                        Request to Join
                                    </Text>

                                    <Text className="text-text text-opacity-70 text-sm">
                                        Approval required from the host.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* pending request */}
                    {data?.requestedToJoin && (
                        <View
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: `${colors.warn}15`,
                                borderWidth: 1,
                                borderColor: `${colors.warn}30`
                            }}
                        >
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="rounded-full p-2.5"
                                    style={{
                                        backgroundColor: `${colors.warn}25`
                                    }}
                                >
                                    <Clock size={20} color={colors.warn} />
                                </View>

                                <View className="flex-1">
                                    <Text
                                        className="font-bold text-base mb-0.5"
                                        style={{ color: colors.warn }}
                                    >
                                        Request Pending
                                    </Text>

                                    <Text className="text-text text-opacity-70 text-sm">
                                        Waiting for approval from the host.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Spacer for bottom button */}
                    <View className="h-24" />
                </View>
            </ScrollView>

            {/* Bottom Actions (non-members) */}
            {!isPast && (
                <View
                    className="px-6 py-4 border-t border-card-border bg-background"
                    style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                >
                    {data?.requestedToJoin ? (
                        <Button
                            variant="outline"
                            size="lg"
                            fullWidth
                            leftIcon={<X size={18} color={colors.error} />}
                            onPress={() => cancelRequestMutation.mutate()}
                            loading={cancelRequestMutation.isPending}
                        >
                            <Text style={{ color: colors.error }}>
                                Cancel Request
                            </Text>
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            leftIcon={<Users size={18} color="#FFFFFF" />}
                            onPress={() => joinMutation.mutate()}
                            loading={joinMutation.isPending}
                        >
                            {burrow.requestToJoin
                                ? "Request to Join"
                                : isProject
                                  ? "Join Project"
                                  : "Join Burrow"}
                        </Button>
                    )}
                </View>
            )}
        </>
    )
}
