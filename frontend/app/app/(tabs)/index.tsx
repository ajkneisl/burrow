import { ScrollView, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Header, CreateFab } from "@features/layout/components"
import { getSchedule, getBurrows } from "@features/burrows/burrows.api"
import { MyProfileCard } from "@features/profile/components/MyProfileCard"
import {
    ScheduleSection,
    UpcomingBurrowsSection
} from "@features/home/components"

/**
 * Home screen
 *
 * @author AJ Kneisl
 */
export default function HomeScreen() {
    const [refreshing, setRefreshing] = useState(false)

    // get schedule
    const {
        data: schedule,
        isLoading: scheduleLoading,
        refetch: refetchSchedule
    } = useQuery({
        queryKey: ["schedule"],
        queryFn: async () => await getSchedule()
    })

    // get upcoming burrows
    const {
        data: upcomingBurrows,
        isLoading: upcomingLoading,
        refetch: refetchBurrows
    } = useQuery({
        queryKey: ["burrows", "upcoming"],
        queryFn: async () => await getBurrows(null)
    })

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        await Promise.all([refetchSchedule(), refetchBurrows()])

        setRefreshing(false)
    }, [refetchSchedule, refetchBurrows])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Burrow" />

            <ScrollView
                className="flex-1 px-6 py-4 bg-background"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <MyProfileCard />

                <ScheduleSection
                    schedule={schedule}
                    isLoading={scheduleLoading}
                />

                <UpcomingBurrowsSection
                    burrows={upcomingBurrows}
                    isLoading={upcomingLoading}
                />
            </ScrollView>

            <CreateFab />
        </SafeAreaView>
    )
}
