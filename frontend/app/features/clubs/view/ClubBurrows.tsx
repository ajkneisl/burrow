import { ClubResponse } from "@features/clubs/club.types"
import { useQuery } from "@tanstack/react-query"
import {
    BurrowResponse,
    NOT_REOCCURRING
} from "@features/burrows/burrows.types"
import { get } from "@api/api"
import { useMemo, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { Calendar, CalendarClock, Plus } from "lucide-react-native"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Modal } from "@components/core"
import { CreateBurrowWizard } from "@features/burrows/create/CreateBurrowWizard"

/**
 * {@link ClubBurrows}
 */
type ClubBurrowsProps = {
    clubResponse: ClubResponse
}

/**
 * A clubs one-off and reoccurring Burrows.
 *
 * @param clubResponse The club response.
 *
 * @author AJ Kneisl
 */
export default function ClubBurrows({ clubResponse }: ClubBurrowsProps) {
    const colors = useThemeColors()
    const [createOpen, setCreateOpen] = useState(false)

    const canCreate =
        clubResponse.membership?.role === "ADMINISTRATOR" ||
        clubResponse.membership?.role === "MODERATOR"

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
            {/* Reoccurring Burrows */}
            <View>
                <Text className="text-text font-semibold text-sm mb-3">
                    Reoccurring Burrows
                </Text>

                {reoccurringBurrows.length === 0 ? (
                    <View className="items-center py-6">
                        <CalendarClock
                            size={32}
                            color={colors.text}
                            style={{ opacity: 0.2 }}
                        />

                        <Text className="text-text opacity-40 text-sm mt-2">
                            No reoccurring Burrows.
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

            {/* Upcoming Burrows */}
            <View>
                <Text className="text-text font-semibold text-sm mb-3">
                    Burrows
                </Text>

                {upcomingBurrows.length === 0 ? (
                    <View className="items-center py-6">
                        <Calendar
                            size={32}
                            color={colors.text}
                            style={{ opacity: 0.2 }}
                        />
                        <Text className="text-text opacity-40 text-sm mt-2">
                            No upcoming Burrows.
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

            {/* Floating Create Button */}
            {canCreate && (
                <Pressable
                    onPress={() => setCreateOpen(true)}
                    className="absolute bottom-6 right-6 bg-secondary rounded-full w-16 h-16 items-center justify-center shadow-lg active:opacity-80"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8
                    }}
                >
                    <Plus size={28} color={colors.primary} strokeWidth={3} />
                </Pressable>
            )}

            {/* Create Meeting Modal */}
            <Modal
                visible={createOpen}
                onClose={() => setCreateOpen(false)}
                size="full"
                scrollable={false}
            >
                <CreateBurrowWizard
                    onClose={() => setCreateOpen(false)}
                    burrowKind="CLUB"
                    initialData={{ clubID: clubResponse.club.id }}
                />
            </Modal>
        </>
    )
}
