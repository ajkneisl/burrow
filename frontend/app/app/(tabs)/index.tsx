import { ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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
 * @constructor
 */
export default function HomeScreen() {
    // get schedule
    const { data: schedule, isLoading: scheduleLoading } = useQuery({
        queryKey: ["schedule"],
        queryFn: async () => await getSchedule()
    })

    // get upcoming burrows
    const { data: upcomingBurrows, isLoading: upcomingLoading } = useQuery({
        queryKey: ["burrows", "upcoming"],
        queryFn: async () => await getBurrows(null)
    })

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header title="Burrow" />

            <ScrollView className="flex-1 px-6 py-4 bg-background">
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
