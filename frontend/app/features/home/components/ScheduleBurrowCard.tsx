import { View, Pressable } from "react-native"
import { Text } from "@components/core"
import { useRouter } from "expo-router"
import { useThemeColors } from "@api/theme/useThemeColors"
import { MessageSquare, Pin } from "lucide-react-native"
import type { ScheduleBurrowResponse } from "@features/burrows/burrows.types"
import { BURROW_KIND_CONFIG } from "@features/burrows/burrows.types"
import { formatDateTime, humanDateLabel } from "@api/util"

/**
 * {@link ScheduleBurrowCard}
 */
type ScheduleBurrowCardProps = {
    item: ScheduleBurrowResponse
}

/**
 * A Burrow on the user's schedule.
 *
 * @param item The scheduled Burrow response.
 *
 * @author AJ Kneisl
 */
export function ScheduleBurrowCard({ item }: ScheduleBurrowCardProps) {
    const router = useRouter()
    const { burrow } = item
    const colors = useThemeColors()

    const handlePress = () => {
        router.push(`/burrow/${burrow.id}`)
    }

    const kindConfig =
        BURROW_KIND_CONFIG[burrow.kind] || BURROW_KIND_CONFIG.STUDY
    const KindIcon = kindConfig.Icon
    const kindColor = colors[kindConfig.colorKey]

    const isProject = burrow.kind === "PROJECT"

    return (
        <Pressable onPress={handlePress} className="mb-3">
            <View
                className="bg-card border border-card-border rounded-2xl p-4 overflow-hidden"
                style={{ borderRightWidth: 4, borderRightColor: kindColor }}
            >
                {/* Title and Time Row */}
                <View className="flex-row items-start justify-between mb-2">
                    <Text
                        className="text-base font-semibold text-text flex-1 mr-2"
                        numberOfLines={1}
                    >
                        {burrow.title}
                    </Text>

                    <Text className="text-sm text-text text-opacity-80 shrink-0">
                        {isProject
                            ? `Due ${humanDateLabel(burrow.endTime)}`
                            : formatDateTime(
                                  burrow.beginningTime,
                                  burrow.endTime
                              )}
                    </Text>
                </View>

                {/* chat preview, kind badge */}
                {!isProject && (
                    <View className="flex-row items-center justify-between w-full">
                        {/* chat preview */}
                        {item.latestChatMessage ? (
                            <View className="flex-row items-center gap-1.5 shrink min-w-0">
                                {item.isPinned ? (
                                    <Pin
                                        size={14}
                                        color={colors.warn}
                                        style={{ flexShrink: 0 }}
                                    />
                                ) : (
                                    <MessageSquare
                                        size={14}
                                        color={colors.text}
                                        style={{ opacity: 0.6, flexShrink: 0 }}
                                    />
                                )}
                                <Text
                                    className="text-xs text-text text-opacity-60"
                                    numberOfLines={1}
                                >
                                    {item.latestChatMessage.message}
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-1.5">
                                <MessageSquare size={14} color={colors.text} />

                                <Text className="text-xs text-text text-opacity-40 italic">
                                    No messages yet
                                </Text>
                            </View>
                        )}

                        {/* kind */}
                        <View className="flex-row items-center gap-2 shrink-0">
                            <View
                                className="px-2 py-1 rounded-full flex-row items-center gap-1"
                                style={{ backgroundColor: `${kindColor}33` }}
                            >
                                <KindIcon
                                    size={13}
                                    color={kindColor}
                                    strokeWidth={2.5}
                                />

                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: kindColor }}
                                >
                                    {kindConfig.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    )
}
