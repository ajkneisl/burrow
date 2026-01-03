import { View, Text, ActivityIndicator, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Calendar, Clock } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Button } from "@components/core"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import { formatDateTime } from "@api/util"

type UpcomingBurrowsSectionProps = {
    burrows:
        | {
              contents: BurrowResponse[]
          }
        | undefined
    isLoading: boolean
}

/**
 * Upcoming burrows section component for the home screen.
 * Displays a list of upcoming burrows with option to browse more.
 */
export function UpcomingBurrowsSection({
    burrows,
    isLoading
}: UpcomingBurrowsSectionProps) {
    const router = useRouter()
    const colors = useThemeColors()

    if (isLoading) {
        return (
            <View className="mb-6">
                <Text className="text-sm font-semibold text-text text-opacity-60 uppercase tracking-wide mb-3">
                    Upcoming Burrows
                </Text>
                <View className="items-center py-8">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text text-opacity-60 mt-4">
                        Loading upcoming Burrows...
                    </Text>
                </View>
            </View>
        )
    }

    if (!burrows?.contents || burrows.contents.length === 0) {
        return (
            <View className="mb-6">
                <Text className="text-sm font-semibold text-text text-opacity-60 uppercase tracking-wide mb-3">
                    Upcoming Burrows
                </Text>
                <View className="items-center py-8">
                    <Calendar size={48} className="text-text text-opacity-20" />
                    <Text className="text-text text-opacity-60 mt-4">
                        No upcoming Burrows
                    </Text>
                    <Text className="text-text text-opacity-40 text-sm mt-1">
                        Check back soon for new Burrows!
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View className="mb-6">
            <Text className="text-sm font-semibold text-text text-opacity-60 uppercase tracking-wide mb-3">
                Upcoming Burrows
            </Text>
            <View className="space-y-3">
                {burrows.contents.slice(0, 3).map((burrowResponse) => (
                    <Pressable
                        key={burrowResponse.burrow.id}
                        onPress={() =>
                            router.push(`/burrow/${burrowResponse.burrow.id}`)
                        }
                        className="mb-3"
                    >
                        <View className="bg-card border border-card-border rounded-2xl p-4">
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1 mr-3">
                                    <Text
                                        className="text-base font-bold text-text"
                                        numberOfLines={1}
                                    >
                                        {burrowResponse.burrow.title}
                                    </Text>
                                    {burrowResponse.burrow.description && (
                                        <Text
                                            className="text-sm text-text text-opacity-60 mt-1"
                                            numberOfLines={2}
                                        >
                                            {burrowResponse.burrow.description}
                                        </Text>
                                    )}
                                </View>
                                <View
                                    className={`px-2 py-1 rounded-full ${
                                        {
                                            STUDY: "bg-info/10",
                                            EVENT: "bg-success/10",
                                            CLUB: "bg-warn/10",
                                            PROJECT: "bg-primary/10"
                                        }[burrowResponse.burrow.kind] ||
                                        "bg-info/10"
                                    }`}
                                >
                                    <Text className="text-xs font-semibold text-text">
                                        {burrowResponse.burrow.kind}
                                    </Text>
                                </View>
                            </View>

                            {burrowResponse.burrow.beginningTime &&
                                burrowResponse.burrow.endTime && (
                                    <View className="flex-row items-center gap-2 mt-2">
                                        <Clock
                                            size={14}
                                            color={colors.text}
                                            style={{ opacity: 0.8 }}
                                        />
                                        <Text className="text-sm text-text text-opacity-80">
                                            {formatDateTime(
                                                burrowResponse.burrow
                                                    .beginningTime,
                                                burrowResponse.burrow.endTime
                                            )}
                                        </Text>
                                    </View>
                                )}
                        </View>
                    </Pressable>
                ))}

                {burrows.contents.length > 3 && (
                    <Button
                        variant="outline"
                        onPress={() => router.push("/browse")}
                        className="mt-3"
                    >
                        Browse
                    </Button>
                )}
            </View>
        </View>
    )
}
