import { View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Clock, Check } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import { BURROW_KIND_CONFIG } from "@features/burrows/burrows.types"
import { formatDateTime } from "@api/util"

/**
 * {@link UpcomingBurrowCard}
 */
type UpcomingBurrowCardProps = {
    burrowResponse: BurrowResponse
}

/**
 * A card for an upcoming Burrow.
 *
 * @param burrowResponse The Burrow response.
 *
 * @author AJ Kneisl
 */
export function UpcomingBurrowCard({ burrowResponse }: UpcomingBurrowCardProps) {
    const router = useRouter()
    const colors = useThemeColors()
    const { burrow, membership } = burrowResponse

    const kindConfig =
        BURROW_KIND_CONFIG[burrow.kind] || BURROW_KIND_CONFIG.STUDY
    const KindIcon = kindConfig.Icon
    const kindColor = colors[kindConfig.colorKey]

    const isJoined = membership?.status === "JOINED"

    return (
        <Pressable
            onPress={() => router.push(`/burrow/${burrow.id}`)}
            className="mb-3"
        >
            <View className="bg-card border border-card-border rounded-2xl p-4">
                <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                        <Text
                            className="text-base font-bold text-text"
                            numberOfLines={1}
                        >
                            {burrow.title}
                        </Text>
                        {burrow.description && (
                            <Text
                                className="text-sm text-text text-opacity-60 mt-1"
                                numberOfLines={2}
                            >
                                {burrow.description}
                            </Text>
                        )}
                    </View>

                    <View
                        className="px-2 py-1 rounded-full flex-row items-center gap-1"
                        style={{ backgroundColor: `${kindColor}33` }}
                    >
                        <KindIcon size={13} color={kindColor} strokeWidth={2.5} />

                        <Text
                            className="text-xs font-bold"
                            style={{ color: kindColor }}
                        >
                            {kindConfig.label}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between">
                    {burrow.beginningTime && burrow.endTime && (
                        <View className="flex-row items-center gap-2">
                            <Clock
                                size={14}
                                color={colors.text}
                                style={{ opacity: 0.8 }}
                            />

                            <Text className="text-sm text-text text-opacity-80">
                                {formatDateTime(burrow.beginningTime, burrow.endTime)}
                            </Text>
                        </View>
                    )}

                    {isJoined && (
                        <View className="flex-row items-center gap-1">
                            <Text className="text-xs text-text">
                                Joined
                            </Text>

                            <Check size={18} color={colors.text}/>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    )
}
