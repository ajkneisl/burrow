import { dayLabel } from "@umnburrow/core/api"
import type { ScheduleBurrowResponse } from "@umnburrow/core/api"
import { View, ActivityIndicator, Pressable } from "react-native"
import { Text } from "@components/core"
import { Calendar, ChevronDown } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

import { ScheduleBurrowCard } from "./ScheduleBurrowCard"
import { useMemo, useState, useEffect } from "react"
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue
} from "react-native-reanimated"

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
export function ScheduleSection({
    schedule,
    isLoading
}: ScheduleSectionProps) {
    const colors = useThemeColors()
    const [projectsExpanded, setProjectsExpanded] = useState(true)
    const rotation = useSharedValue(0)
    const height = useSharedValue(1)
    const opacity = useSharedValue(1)

    const { projects, scheduledBurrows } = useMemo(() => {
        if (!schedule) return { projects: [], scheduledBurrows: [] }

        const projects: ScheduleBurrowResponse[] = []
        const scheduledBurrows: ScheduleBurrowResponse[] = []

        schedule.forEach((item) => {
            if (item.burrow.beginningTime === 0) {
                projects.push(item)
            } else {
                scheduledBurrows.push(item)
            }
        })

        projects.sort((a, b) => a.burrow.endTime - b.burrow.endTime)

        return { projects, scheduledBurrows }
    }, [schedule])

    const groupedSchedule = useMemo(() => {
        return scheduledBurrows.reduce(
            (acc, item) => {
                const day = dayLabel(item.burrow.beginningTime)
                if (!acc[day]) acc[day] = []
                acc[day].push(item)
                return acc
            },
            {} as Record<string, ScheduleBurrowResponse[]>
        )
    }, [scheduledBurrows])

    const sortedDays = useMemo(() => {
        return Object.keys(groupedSchedule).sort((a, b) => {
            const aItem = groupedSchedule[a][0]
            const bItem = groupedSchedule[b][0]
            return aItem.burrow.beginningTime - bItem.burrow.beginningTime
        })
    }, [groupedSchedule])

    useEffect(() => {
        if (projects.length > 3) {
            setProjectsExpanded(false)
            rotation.value = -90
            height.value = 0
            opacity.value = 0
        }
    }, [projects.length, rotation, height, opacity])

    useEffect(() => {
        rotation.value = withTiming(projectsExpanded ? 0 : -90, {
            duration: 200
        })
        height.value = withTiming(projectsExpanded ? 1 : 0, {
            duration: 250
        })
        opacity.value = withTiming(projectsExpanded ? 1 : 0, {
            duration: 200
        })
    }, [projectsExpanded, rotation, height, opacity])

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }))

    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        overflow: "hidden" as const,
        maxHeight: height.value * 1000,
        marginTop: height.value * 8
    }))

    const hasContent = sortedDays.length > 0 || projects.length > 0

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

    if (!hasContent) {
        return (
            <View className="mb-6">
                <View className="items-center py-8">
                    <Calendar size={48} color={colors.text} />

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
            <View className="gap-4">
                {/* Projects Section */}
                {projects.length > 0 && (
                    <View className="mb-4">
                        <Pressable
                            onPress={() => setProjectsExpanded(!projectsExpanded)}
                            className="flex-row items-center gap-2 mb-2"
                        >
                            <Animated.View style={chevronStyle}>
                                <ChevronDown
                                    size={16}
                                    color={colors.text}
                                    style={{ opacity: 0.6 }}
                                />
                            </Animated.View>
                            <Text className="text-sm font-semibold text-text text-opacity-60 uppercase">
                                Projects ({projects.length})
                            </Text>
                        </Pressable>

                        <Animated.View style={contentStyle}>
                            {projects.map((item) => (
                                <ScheduleBurrowCard
                                    key={item.burrow.id}
                                    item={item}
                                />
                            ))}
                        </Animated.View>
                    </View>
                )}

                {/* Scheduled Burrows by Day */}
                {sortedDays.map((day) => (
                    <View key={day} className="mb-4">
                        <Text className="text-sm font-semibold text-text text-opacity-60 mb-2 uppercase">
                            {day}
                        </Text>
                        {groupedSchedule[day]
                            .sort(
                                (a, b) =>
                                    a.burrow.beginningTime -
                                    b.burrow.beginningTime
                            )
                            .map((item) => (
                                <ScheduleBurrowCard
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
