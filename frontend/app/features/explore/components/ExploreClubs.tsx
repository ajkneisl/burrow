import {
    View,
    FlatList,
    ScrollView,
    RefreshControl,
    Pressable,
    ActivityIndicator
} from "react-native"
import { useState, useMemo } from "react"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { get } from "@api/api"
import { Compass, Users, Plus } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { FilterChip, Text } from "@components/core"
import { createClubModalOpen } from "@features/layout/layout.atom"
import ClubCard from "@features/clubs/components/ClubCard"
import type { PaginatedResponse } from "@api/api.types"
import type {
    Club,
    ClubCategory,
    MyClubResponse
} from "@features/clubs/club.types"

type ClubTab = "discover" | "my-clubs"

const CATEGORIES: { label: string; value: ClubCategory }[] = [
    { label: "Sports", value: "SPORTS" },
    { label: "Social", value: "SOCIAL" },
    { label: "Creative", value: "CREATIVE" },
    { label: "Educational", value: "EDUCATIONAL" }
]

/**
 * The Clubs side of the Explore tab — discover clubs and manage your own.
 *
 * @author AJ Kneisl
 */
export function ExploreClubs() {
    const router = useRouter()
    const colors = useThemeColors()
    const [, setCreateClubOpen] = useAtom(createClubModalOpen)

    const [activeTab, setActiveTab] = useState<ClubTab>("discover")
    const [category, setCategory] = useState<ClubCategory | null>(null)
    const [page, setPage] = useState(1)

    const {
        data: myClubs,
        isLoading: myClubsLoading,
        isRefetching: myClubsRefetching,
        refetch: refetchMine
    } = useQuery<MyClubResponse[]>({
        queryKey: ["clubs", "mine"],
        queryFn: async () => await get("/clubs/mine")
    })

    const {
        data: discoverData,
        isLoading: discoverLoading,
        refetch: refetchDiscover,
        isRefetching: discoverRefetching
    } = useQuery<PaginatedResponse<Club>>({
        queryKey: ["clubs", "discover", category, page],
        queryFn: async () =>
            await get("/clubs", {
                query: {
                    page,
                    ...(category ? { category } : {})
                }
            })
    })

    const myClubIds = useMemo(
        () => new Set((myClubs ?? []).map((c) => c.club.id)),
        [myClubs]
    )

    const clubs = discoverData?.contents ?? []

    return (
        <View className="flex-1">
            {/* Category filters — nothing selected shows all clubs */}
            <View className="px-6 py-3 border-b border-card-border">
                <View className="flex-row gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <FilterChip
                            key={cat.label}
                            label={cat.label}
                            active={
                                activeTab === "discover" &&
                                category === cat.value
                            }
                            onPress={() => {
                                setActiveTab("discover")
                                // tap the active category again to clear it
                                setCategory((prev) =>
                                    prev === cat.value ? null : cat.value
                                )
                                setPage(1)
                            }}
                        />
                    ))}
                    <FilterChip
                        label="My Clubs"
                        active={activeTab === "my-clubs"}
                        onPress={() =>
                            setActiveTab((prev) =>
                                prev === "my-clubs" ? "discover" : "my-clubs"
                            )
                        }
                    />
                </View>
            </View>

            {activeTab === "discover" && (
                <FlatList
                    data={clubs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 100,
                        gap: 12
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={discoverRefetching}
                            onRefresh={() => {
                                void refetchMine()
                                void refetchDiscover()
                            }}
                            tintColor={colors.primary}
                        />
                    }
                    renderItem={({ item }) => (
                        <ClubCard
                            variant="discover"
                            club={item}
                            isMember={myClubIds.has(item.id)}
                            onPress={() =>
                                router.push(`/club/${item.name}` as any)
                            }
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center py-12">
                            {discoverLoading ? (
                                <Text className="text-text opacity-60">
                                    Loading clubs...
                                </Text>
                            ) : (
                                <View className="items-center">
                                    <Compass
                                        size={48}
                                        color={colors.text}
                                        style={{ opacity: 0.2 }}
                                    />
                                    <Text className="text-text opacity-60 mt-4">
                                        No clubs found
                                    </Text>
                                    <Text className="text-text opacity-40 text-sm mt-1">
                                        Try changing your filters
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                />
            )}

            {activeTab === "my-clubs" && (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={myClubsRefetching}
                            onRefresh={() => void refetchMine()}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {myClubsLoading ? (
                        <View className="items-center justify-center py-12">
                            <ActivityIndicator
                                size="large"
                                color={colors.primary}
                            />
                        </View>
                    ) : !myClubs || myClubs.length === 0 ? (
                        <View className="items-center justify-center py-12">
                            <Users
                                size={48}
                                color={colors.text}
                                style={{ opacity: 0.2 }}
                            />
                            <Text className="text-text opacity-60 mt-4">
                                You&apos;re not in any clubs yet
                            </Text>
                            <Text className="text-text opacity-40 text-sm mt-1">
                                Browse clubs to find one to join
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {myClubs.map((item) => (
                                <ClubCard
                                    key={item.club.id}
                                    item={item}
                                    onPress={() =>
                                        router.push(
                                            `/club/${item.club.name}` as any
                                        )
                                    }
                                />
                            ))}
                        </View>
                    )}

                    {/* Create club button */}
                    <Pressable
                        onPress={() => setCreateClubOpen(true)}
                        className="bg-primary rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 mt-4"
                    >
                        <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                        <Text className="text-white font-semibold text-sm">
                            Create Club
                        </Text>
                    </Pressable>
                </ScrollView>
            )}
        </View>
    )
}
