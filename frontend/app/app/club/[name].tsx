import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { ChevronLeft, Users } from "lucide-react-native"
import { get } from "@api/api"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Button } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import type { ClubResponse } from "@features/clubs/club.types"
import ClubBannerPicture from "@features/clubs/components/ClubBannerPicture"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture"
import ClubModeration from "@features/clubs/view/ClubModeration"
import ClubDetails from "@features/clubs/view/ClubDetails"
import ClubJoin from "@features/clubs/view/ClubJoin"
import ClubBurrows from "@features/clubs/view/ClubBurrows"
import ClubMembers from "@features/clubs/view/ClubMembers"
import useClubRole from "@features/clubs/hooks/useClubRole"

/**
 * Club detail screen.
 *
 * @author AJ Kneisl
 */
export default function ClubDetailScreen() {
    const { name } = useLocalSearchParams<{ name: string }>()

    const { isOwner } = useClubRole(name)

    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const [refreshing, setRefreshing] = useState(false)

    const { data, isLoading, isError, refetch } = useQuery<ClubResponse>({
        queryKey: ["club", name],
        enabled: !!name,
        queryFn: async () => await get(`/clubs/${name}`)
    })

    // refresh everything when swiping down
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([
            refetch(),
            queryClient.invalidateQueries({ queryKey: ["clubMembers", name] }),
            queryClient.invalidateQueries({ queryKey: ["clubBurrows", name] })
        ])
        setRefreshing(false)
    }, [name, refetch, queryClient])

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        )
    }

    if (isError || !data || !name) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <ThemedIcon icon={ChevronLeft} size={28} />
                    </Pressable>
                </View>

                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-text opacity-60 text-lg mb-4">
                        Failed to load club
                    </Text>
                    <Button variant="primary" onPress={() => router.back()}>
                        Go Back
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    const { club } = data

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center gap-3">
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <ThemedIcon icon={ChevronLeft} size={28} />
                </Pressable>
                <Text
                    className="text-text font-semibold text-lg flex-1"
                    numberOfLines={1}
                >
                    {club.displayName}
                </Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Banner + Profile */}
                <View className="bg-card border-b border-card-border">
                    {/* Banner area */}
                    <ClubBannerPicture clubID={club.id} />

                    <View className="px-6 pb-5">
                        {/* Avatar overlapping banner */}
                        <View className="-mt-10 mb-3">
                            <ClubProfilePicture
                                clubID={club.id}
                                displayName={club.displayName}
                                size={80}
                            />
                        </View>

                        {/* Club info */}
                        <Text className="text-text opacity-50 text-xs font-medium uppercase tracking-wider">
                            {club.category}
                        </Text>

                        <Text className="text-text text-2xl font-bold tracking-tight mt-1">
                            {club.displayName}
                        </Text>

                        <Text className="text-text opacity-40 text-sm font-medium">
                            /club/{club.name}
                        </Text>

                        <View className="flex-row items-center gap-1.5 mt-1">
                            <Users
                                size={14}
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />

                            <Text className="text-text opacity-60 text-sm">
                                {data.memberCount} member
                                {data.memberCount !== 1 ? "s" : ""}
                            </Text>
                        </View>

                        {/* Actions */}
                        <View className="flex-row items-center gap-2 mt-4">
                            {!isOwner && <ClubJoin clubResponse={data} />}

                            <ClubModeration clubResponse={data} />
                        </View>
                    </View>
                </View>

                <View className="px-4 py-5 gap-5">
                    {/* details */}
                    <ClubDetails clubResponse={data} />

                    {/* burrows */}
                    <ClubBurrows clubResponse={data} />

                    {/* members */}
                    <ClubMembers clubResponse={data} />
                </View>

                {/* Bottom spacing */}
                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}
