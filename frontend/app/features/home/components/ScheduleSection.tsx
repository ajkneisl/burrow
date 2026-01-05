import { View, Text, ActivityIndicator } from "react-native"
import { Calendar } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { ScheduleBurrowResponse } from "@features/burrows/burrows.types"
import { dayLabel } from "@api/util"
import { ScheduleCard } from "./ScheduleCard"

/**
 * {@see ScheduleSection}
 */
type ScheduleSectionProps = {
    schedule: ScheduleBurrowResponse[] | undefined
    isLoading: boolean
}

/**
 * The schedule section on the homepage.
 *
 * @param schedule All the user's scheduled Burrows from the API.
 * @param isLoading If {@link schedule} is still loading.
 *
 * @author AJ Kneisl
 */
export function ScheduleSection({ schedule, isLoading }: ScheduleSectionProps) {
    const colors = useThemeColors()

    // group schedule by day
    const groupedSchedule =
        schedule?.reduce(
            (acc, item) => {
                const day = dayLabel(item.burrow.beginningTime)
                if (!acc[day]) acc[day] = []
                acc[day].push(item)
                return acc
            },
            {} as Record<string, ScheduleBurrowResponse[]>
        ) || {}

    // get day keys
    const sortedDays = Object.keys(groupedSchedule).sort((a, b) => {
        const aItem = groupedSchedule[a][0]
        const bItem = groupedSchedule[b][0]
        return aItem.burrow.beginningTime - bItem.burrow.beginningTime
    })

    if (isLoading) {
        return (
            <View className="mb-6">
                <View className="items-center py-8">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text text-opacity-60 mt-4">
                        Loading your schedule...
                    </Text>
                </View>
            </View>
        )
    }

    if (sortedDays.length === 0) {
        return (
            <View className="mb-6">
                <View className="items-center py-8">
                    <Calendar size={48} className="text-text text-opacity-20" />

                    <Text className="text-text text-opacity-60 mt-4">
                        No upcoming Burrows
                    </Text>

                    <Text className="text-text text-opacity-40 text-sm mt-1">
                        Create or join one to get started!
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View className="mb-6">
            <View className="space-y-4">
                {sortedDays.map((day) => (
                    <View key={day} className="mb-4">
                        <Text className="text-sm font-semibold text-text text-opacity-80 mb-2">
                            {day}
                        </Text>
                        {groupedSchedule[day]
                            .sort(
                                (a, b) =>
                                    a.burrow.beginningTime -
                                    b.burrow.beginningTime
                            )
                            .map((item) => (
                                <ScheduleCard
                                    key={item.burrow.id}
                                    item={item}
                                />
                            ))}
                    </View>
                ))}
            </View>
        </View>
    )
}
