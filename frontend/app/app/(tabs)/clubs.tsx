import {
    View,
    Text,
    FlatList,
    RefreshControl,
    Pressable,
    Image,
    TextInput
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useMemo } from "react"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Header } from "@features/layout/components"
import { get } from "@api/api"
import { CDN_URL } from "@api/util"
import { Search, Compass } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { FilterChip } from "@components/core"
import type { PaginatedResponse } from "@api/api.types"
import type { Club, ClubCategory, MyClubResponse } from "@features/clubs/club.types"

const CATEGORIES: { label: string; value: ClubCategory | null }[] = [
    { label: "All", value: null },
    { label: "Sports", value: "SPORTS" },
    { label: "Social", value: "SOCIAL" },
    { label: "Creative", value: "CREATIVE" },
    { label: "Educational", value: "EDUCATIONAL" }
]

/**
 * Club discovery screen.
 *
 * @author AJ Kneisl
 */
export default function ClubsScreen() {
    const router = useRouter()
    const colors = useThemeColors()

    const [category, setCategory] = useState<ClubCategory | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)

    const { data: myClubs, isLoading: myClubsLoading, refetch: refetchMine } = useQuery<MyClubResponse[]>({
        queryKey: ["clubs", "mine"],
        queryFn: async () => await get("/clubs/mine")
    })

    const {
        data: discoverData,
        isLoading: discoverLoading,
        refetch: refetchDiscover,
        isRefetching
    } = useQuery<PaginatedResponse<Club>>({
        queryKey: ["clubs", "discover", category, searchQuery, page],
        queryFn: async () =>
            await get("/clubs", {
                query: {
                    page,
                    ...(category ? { category } : {}),
                    ...(searchQuery.trim() ? { query: searchQuery.trim() } : {})
                }
            })
    })

    const myClubIds = useMemo(
        () => new Set((myClubs ?? []).map((c) => c.club.id)),
        [myClubs]
    )

    const clubs = discoverData?.contents ?? []
    const isLoading = myClubsLoading || discoverLoading

    const refetch = () => {
        void refetchMine()
        void refetchDiscover()
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Clubs" showSearch={false} />

            {/* Search */}
            <View className="px-4 pt-3 pb-2">
                <View className="flex-row items-center bg-card rounded-xl border border-card-border px-3 py-2 gap-2">
                    <Search size={18} color={colors.text} style={{ opacity: 0.4 }} />
                    <TextInput
                        className="flex-1 text-text text-sm"
                        placeholder="Search clubs..."
                        placeholderTextColor={`${colors.text}66`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* Category filters */}
            <View className="px-4 pb-3">
                <View className="flex-row gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <FilterChip
                            key={cat.label}
                            label={cat.label}
                            active={category === cat.value}
                            onPress={() => {
                                setCategory(cat.value)
                                setPage(1)
                            }}
                        />
                    ))}
                </View>
            </View>

            <View className="border-b border-card-border" />

            <FlatList
                data={clubs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
                ListHeaderComponent={() =>
                    myClubs && myClubs.length > 0 ? (
                        <View className="mb-4">
                            <Text className="text-xs font-semibold text-text opacity-60 uppercase tracking-wider mb-3">
                                My Clubs
                            </Text>

                            <View className="gap-2">
                                {myClubs.map((mc) => (
                                    <ClubCard
                                        key={mc.club.id}
                                        club={mc.club}
                                        isMember
                                        onPress={() => router.push(`/club/${mc.club.name}` as any)}
                                    />
                                ))}
                            </View>

                            <Text className="text-xs font-semibold text-text opacity-60 uppercase tracking-wider mt-6 mb-1">
                                Discover
                            </Text>
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <ClubCard
                        club={item}
                        isMember={myClubIds.has(item.id)}
                        onPress={() => router.push(`/club/${item.name}` as any)}
                    />
                )}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-12">
                        {isLoading ? (
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
        </SafeAreaView>
    )
}

function ClubCard({
    club,
    isMember,
    onPress
}: {
    club: Club
    isMember: boolean
    onPress: () => void
}) {
    const [imageError, setImageError] = useState(false)

    const initials = useMemo(
        () =>
            club.displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join(""),
        [club.displayName]
    )

    return (
        <Pressable
            onPress={onPress}
            className="bg-card rounded-xl border border-card-border p-4 flex-row items-center gap-3 active:opacity-80"
        >
            {/* Avatar */}
            <View className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 items-center justify-center">
                {!imageError ? (
                    <Image
                        source={{ uri: `${CDN_URL}/avatars/club/${club.id}/avatar` }}
                        className="h-12 w-12"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <Text className="text-primary font-bold text-lg">
                        {initials}
                    </Text>
                )}
            </View>

            {/* Info */}
            <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                    <Text
                        className="text-text font-semibold text-base"
                        numberOfLines={1}
                    >
                        {club.displayName}
                    </Text>

                    {isMember && (
                        <View className="bg-primary/15 rounded-full px-2 py-0.5">
                            <Text className="text-primary text-[10px] font-semibold">
                                Joined
                            </Text>
                        </View>
                    )}
                </View>

                <Text className="text-text opacity-50 text-xs">
                    {club.category.charAt(0) + club.category.slice(1).toLowerCase()}
                </Text>

                {club.description ? (
                    <Text
                        className="text-text opacity-60 text-sm mt-1"
                        numberOfLines={2}
                    >
                        {club.description}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    )
}
