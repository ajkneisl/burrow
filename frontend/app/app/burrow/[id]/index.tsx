import { View, Text, ScrollView, RefreshControl } from "react-native"
import { Pressable } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Clock,
    Archive,
    Edit2,
    Trash2,
    Settings,
    UserPlus,
    ListChecks
} from "lucide-react-native"
import { Button, Card } from "@components/core"
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
        isOwner,
        isHostOrMod,
        isPast,
        isProject,
        blocks,
        leaveMutation,
        deleteMutation,
        setEditModalOpen,
        setFeaturesModalOpen,
        setInviteModalOpen,
        setManageInvitesModalOpen,
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
                {/* moderation tools */}
                {isOwner && !isPast && (
                    <Card variant="bordered">
                        <View className="flex-row flex-wrap gap-3 justify-evenly">
                            {/* edit burrow */}
                            <Pressable
                                onPress={() => setEditModalOpen(true)}
                                className="items-center"
                            >
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                    style={{
                                        backgroundColor: `${colors.primary}1A`
                                    }}
                                >
                                    <ThemedIcon
                                        icon={Edit2}
                                        size={20}
                                        overrideColor="primary"
                                    />
                                </View>

                                <Text className="text-xs text-text">Edit</Text>
                            </Pressable>

                            {/* manage features */}
                            <Pressable
                                onPress={() => setFeaturesModalOpen(true)}
                                className="items-center"
                            >
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                    style={{
                                        backgroundColor: `${colors.secondary}1A`
                                    }}
                                >
                                    <ThemedIcon
                                        icon={Settings}
                                        size={20}
                                        overrideColor="secondary"
                                    />
                                </View>

                                <Text className="text-xs text-text">
                                    Features
                                </Text>
                            </Pressable>

                            {/* invite users */}
                            <Pressable
                                onPress={() => setInviteModalOpen(true)}
                                className="items-center"
                            >
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                    style={{
                                        backgroundColor: `${colors.info}1A`
                                    }}
                                >
                                    <ThemedIcon
                                        icon={UserPlus}
                                        size={20}
                                        overrideColor={"info"}
                                    />
                                </View>

                                <Text className="text-xs text-text">
                                    Invite
                                </Text>
                            </Pressable>

                            {/* manage invites*/}
                            <Pressable
                                onPress={() => setManageInvitesModalOpen(true)}
                                className="items-center"
                            >
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                    style={{
                                        backgroundColor: `${colors.info}1A`
                                    }}
                                >
                                    <ThemedIcon
                                        icon={ListChecks}
                                        size={20}
                                        overrideColor={"info"}
                                    />
                                </View>

                                <Text className="text-xs text-text">
                                    Invites
                                </Text>
                            </Pressable>

                            {/* delete */}
                            <Pressable
                                onPress={() => deleteMutation.mutate()}
                                disabled={deleteMutation.isPending}
                                className="items-center"
                            >
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                    style={{
                                        backgroundColor: `${colors.error}1A`
                                    }}
                                >
                                    <ThemedIcon
                                        icon={Trash2}
                                        size={20}
                                        overrideColor={"error"}
                                    />
                                </View>

                                <Text className="text-xs text-text">
                                    Delete
                                </Text>
                            </Pressable>
                        </View>
                    </Card>
                )}

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
                        <View className="flex-row items-center justify-between">
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
                                        overrideColor={
                                            isPast ? "error" : "success"
                                        }
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
                    </View>
                )}

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
                            {burrow.tags.map((tag: string, index: number) => (
                                <View
                                    key={index}
                                    className="bg-background border-card-border border px-2 py-1 rounded-full"
                                >
                                    <Text className="text-sm text-text dark:text-text">
                                        {tag}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </Card>
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

                {/* Spacer for bottom tab bar */}
                <View className="h-4" />
            </View>
        </ScrollView>
    )
}
