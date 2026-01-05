import { View, Text, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { Calendar } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Button } from "@components/core"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import { UpcomingBurrowCard } from "./UpcomingBurrowCard"

/**
 * {@link UpcomingBurrowsSection}
 */
type UpcomingBurrowsSectionProps = {
    burrows:
        | {
              contents: BurrowResponse[]
          }
        | undefined
    isLoading: boolean
}

/**
 * The upcoming Burrows section on the homepage.
 *
 * @param burrows The upcoming Burrows from the API.
 * @param isLoading If {@link burrows} is still loading.
 *
 * @author AJ Kneisl
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
                {burrows.contents.slice(0, 5).map((burrowResponse) => (
                    <UpcomingBurrowCard
                        key={burrowResponse.burrow.id}
                        burrowResponse={burrowResponse}
                    />
                ))}

                {burrows.contents.length > 5 && (
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
