import { View } from "react-native"
import { Skeleton } from "@components/core"

/**
 * Placeholder shown in place of an {@link UpcomingBurrowCard} while Burrows
 * are still loading.
 *
 * @author Yordanos Eshete
 */
export function BurrowCardSkeleton() {
    return (
        <View className="bg-card border border-card-border rounded-2xl p-4 mb-3">
            {/* header */}
            <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-3 gap-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                </View>

                <Skeleton className="h-12 w-12 rounded-full" />
            </View>

            {/* footer */}
            <View className="flex-row items-center justify-between mt-3">
                <Skeleton className="h-6 w-16 rounded-full" />

                <View className="flex-row gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                </View>
            </View>
        </View>
    )
}
