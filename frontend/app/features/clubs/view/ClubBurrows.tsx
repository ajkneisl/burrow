import { ClubResponse } from "@features/clubs/club.types"
import { useQuery } from "@tanstack/react-query"
import {
    BurrowResponse,
    NOT_REOCCURRING
} from "@features/burrows/burrows.types"
import { get } from "@api/api"
import { useMemo } from "react"
import { Text, View } from "react-native"
import { Calendar, CalendarClock } from "lucide-react-native"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * {@link ClubBurrows}
 */
type ClubBurrowsProps = {
    clubResponse: ClubResponse
}

/**
 * A clubs one-off and reoccuring Burrows.
 *
 * @param clubResponse The club response.
 *
 * @author AJ Kneisl
 */
export default function ClubBurrows({ clubResponse }: ClubBurrowsProps) {
    const colors = useThemeColors()

    const name = clubResponse.club.name

    const { data: burrows } = useQuery<BurrowResponse[]>({
        queryKey: ["clubBurrows", name],
        enabled: !!name,
        queryFn: async () => await get(`/clubs/${name}/burrows`)
    })

    const reoccurringBurrows = useMemo(
        () =>
            (burrows ?? []).filter(
                (b) => b.burrow.reoccurring !== NOT_REOCCURRING
            ),
        [burrows]
    )

    const upcomingBurrows = useMemo(
        () =>
            (burrows ?? []).filter(
                (b) => b.burrow.reoccurring === NOT_REOCCURRING
            ),
        [burrows]
    )

    return (
        <>
            {/* Reoccurring Meetings */}
            <View>
                <Text className="text-text font-semibold text-sm mb-3">
                    Reoccurring Meetings
                </Text>

                {reoccurringBurrows.length === 0 ? (
                    <View className="items-center py-6">
                        <CalendarClock
                            size={32}
                            color={colors.text}
                            style={{ opacity: 0.2 }}
                        />
                        <Text className="text-text opacity-40 text-sm mt-2">
                            No reoccurring meetings.
                        </Text>
                    </View>
                ) : (
                    <View className="gap-2">
                        {reoccurringBurrows.map((b) => (
                            <UpcomingBurrowCard
                                key={b.burrow.id}
                                burrowResponse={b}
                                verbose
                            />
                        ))}
                    </View>
                )}
            </View>

            {/* Upcoming Meetings */}
            <View>
                <Text className="text-text font-semibold text-sm mb-3">
                    Meetings
                </Text>
                {upcomingBurrows.length === 0 ? (
                    <View className="items-center py-6">
                        <Calendar
                            size={32}
                            color={colors.text}
                            style={{ opacity: 0.2 }}
                        />
                        <Text className="text-text opacity-40 text-sm mt-2">
                            No meetings.
                        </Text>
                    </View>
                ) : (
                    <View className="gap-2">
                        {upcomingBurrows.map((b) => (
                            <UpcomingBurrowCard
                                key={b.burrow.id}
                                burrowResponse={b}
                                verbose
                            />
                        ))}
                    </View>
                )}
            </View>
        </>
    )
}
