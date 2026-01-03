import { View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    BookOpen,
    PartyPopper,
    Users,
    FolderKanban,
    MessageSquare,
    Pin
} from "lucide-react-native"
import type { ScheduleBurrowResponse } from "@features/burrows/burrows.types"
import { BURROW_KIND_CONFIG } from "@features/burrows/burrows.types"
import { formatDateTime, humanDateLabel } from "@api/util"

type ScheduleCardProps = {
    item: ScheduleBurrowResponse
}

/**
 * A scheduled burrow card with design matching the web version.
 * Features colored border, compact layout, and chat preview.
 */
export function ScheduleCard({ item }: ScheduleCardProps) {
    const router = useRouter()
    const { burrow } = item
    const colors = useThemeColors()

    const handlePress = () => {
        router.push(`/burrow/${burrow.id}`)
    }

    const kindConfig =
        BURROW_KIND_CONFIG[burrow.kind] || BURROW_KIND_CONFIG.STUDY

    // Get border color based on burrow kind
    const borderColor =
        {
            STUDY: colors.success,
            EVENT: colors.secondary,
            CLUB: colors.info,
            PROJECT: colors.error
        }[burrow.kind] || colors.success

    const isProject = burrow.kind === "PROJECT"

    return (
        <Pressable onPress={handlePress} className="mb-3">
            <View
                className="bg-card border border-card-border rounded-2xl p-4 overflow-hidden"
                style={{ borderRightWidth: 4, borderRightColor: borderColor }}
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

                {/* Kind Badge, Tags, and Chat Preview Row */}
                {!isProject && (
                    <View className="flex-row items-center justify-between">
                        {/* Left side: Kind badge */}
                        <View className="flex-row items-center gap-2 shrink-0">
                            <View
                                className="px-2 py-1 rounded-full flex-row items-center gap-1"
                                style={{ backgroundColor: `${borderColor}33` }}
                            >
                                {burrow.kind === "STUDY" && (
                                    <BookOpen
                                        size={13}
                                        color={borderColor}
                                        strokeWidth={2.5}
                                    />
                                )}
                                {burrow.kind === "EVENT" && (
                                    <PartyPopper
                                        size={13}
                                        color={borderColor}
                                        strokeWidth={2.5}
                                    />
                                )}
                                {burrow.kind === "CLUB" && (
                                    <Users
                                        size={13}
                                        color={borderColor}
                                        strokeWidth={2.5}
                                    />
                                )}
                                {burrow.kind === "PROJECT" && (
                                    <FolderKanban
                                        size={13}
                                        color={borderColor}
                                        strokeWidth={2.5}
                                    />
                                )}
                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: borderColor }}
                                >
                                    {kindConfig.label}
                                </Text>
                            </View>
                        </View>

                        {/* Right side: Chat preview */}
                        {item.latestChatMessage ? (
                            <View className="flex-row items-center gap-1.5 flex-1 ml-2 min-w-0">
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
                                    className="text-xs text-text text-opacity-60 flex-1"
                                    numberOfLines={1}
                                >
                                    {item.latestChatMessage.message}
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-1.5 flex-1 ml-2">
                                <MessageSquare
                                    size={14}
                                    color={colors.text}
                                    style={{ opacity: 0.4, flexShrink: 0 }}
                                />
                                <Text className="text-xs text-text text-opacity-40 italic">
                                    No messages yet
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    )
}
