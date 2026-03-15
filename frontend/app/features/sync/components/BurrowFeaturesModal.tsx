import { View, Switch, Pressable } from "react-native"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { X, MessageSquare, Timer } from "lucide-react-native"
import { Button, Card, Text } from "@components/core"
import { saveBlocks } from "@features/sync/blocks.api"
import type { Blocks } from "@features/sync/sync.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import Toast from "react-native-toast-message"

type BurrowFeaturesModalProps = {
    burrowId: string
    currentBlocks: Blocks[]
    onClose: () => void
}

/**
 * Modal for managing burrow features (Chat, Pomodoro).
 * Owner/moderator only.
 */
export function BurrowFeaturesModal({
    burrowId,
    currentBlocks,
    onClose
}: BurrowFeaturesModalProps) {
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const [chatEnabled, setChatEnabled] = useState(
        currentBlocks.includes("CHAT")
    )
    const [pomodoroEnabled, setPomodoroEnabled] = useState(
        currentBlocks.includes("POMODORO")
    )

    // Sync with props if they change
    useEffect(() => {
        setChatEnabled(currentBlocks.includes("CHAT"))
        setPomodoroEnabled(currentBlocks.includes("POMODORO"))
    }, [currentBlocks])

    const saveBlocksMutation = useMutation({
        mutationFn: async () => {
            const blocks: string[] = []
            if (chatEnabled) blocks.push("CHAT")
            if (pomodoroEnabled) blocks.push("POMODORO")

            await saveBlocks(burrowId, blocks)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["burrow", burrowId] })
            Toast.show({
                type: "success",
                text1: "Features updated",
                text2: "Burrow features have been saved"
            })
            onClose()
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to update features",
                text2: "Please try again"
            })
        }
    })

    const hasChanges =
        chatEnabled !== currentBlocks.includes("CHAT") ||
        pomodoroEnabled !== currentBlocks.includes("POMODORO")

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-card-border">
                <Text className="text-xl font-bold text-text">
                    Burrow Features
                </Text>

                <Pressable onPress={onClose} className="p-2 -mr-2">
                    <X size={24} color={colors.text} />
                </Pressable>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 py-4">
                <Text className="text-text text-opacity-60 text-sm mb-4">
                    Enable or disable features for this burrow. Changes will
                    apply to all members.
                </Text>

                {/* Chat Toggle */}
                <Card variant="bordered" className="mb-3">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: `${colors.primary}1A`
                                }}
                            >
                                <MessageSquare
                                    size={20}
                                    color={colors.primary}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text font-semibold mb-0.5">
                                    Chat
                                </Text>
                                <Text className="text-text text-opacity-60 text-xs">
                                    Real-time messaging for members
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={chatEnabled}
                            onValueChange={setChatEnabled}
                            trackColor={{
                                false: colors.card,
                                true: colors.primary
                            }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </Card>

                {/* Pomodoro Toggle */}
                <Card variant="bordered">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: `${colors.secondary}1A`
                                }}
                            >
                                <Timer size={20} color={colors.secondary} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text font-semibold mb-0.5">
                                    Pomodoro Timer
                                </Text>
                                <Text className="text-text text-opacity-60 text-xs">
                                    Shared focus timer for study sessions
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={pomodoroEnabled}
                            onValueChange={setPomodoroEnabled}
                            trackColor={{
                                false: colors.card,
                                true: colors.secondary
                            }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </Card>

                {/* Info Note */}
                <View className="mt-6 p-4 bg-info/10 rounded-lg">
                    <Text className="text-text text-opacity-80 text-xs">
                        <Text className="font-semibold">Note:</Text> Disabling
                        features will hide them from all members. Any existing
                        data (messages, timer state) will be preserved.
                    </Text>
                </View>
            </View>

            {/* Footer Actions */}
            <View className="px-6 py-4 border-t border-card-border">
                <View className="flex-row gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onPress={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onPress={() => saveBlocksMutation.mutate()}
                        disabled={!hasChanges}
                        loading={saveBlocksMutation.isPending}
                        className="flex-1"
                    >
                        Save Changes
                    </Button>
                </View>
            </View>
        </View>
    )
}
