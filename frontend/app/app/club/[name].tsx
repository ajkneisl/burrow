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
import { useState, useMemo, useCallback } from "react"
import {
    ChevronLeft,
    Users,
    CalendarClock,
    Calendar,
    Instagram,
    Globe,
    Linkedin,
    Pencil
} from "lucide-react-native"
import { get, post, del } from "@api/api"
import { NOT_REOCCURRING } from "@features/burrows/burrows.types"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import type { PaginatedResponse } from "@api/api.types"
import useUser from "@features/auth/hooks/useUser"
import { useThemeColors } from "@api/theme/useThemeColors"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"
import { Button, Card } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import Toast from "react-native-toast-message"
import type {
    ClubResponse,
    ClubMemberResponse,
    ClubLink
} from "@features/clubs/club.types"
import { ROLE_ORDER } from "@features/clubs/club.types"
import ClubBannerPicture from "@features/clubs/components/ClubBannerPicture"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture"
import ClubMember from "@features/clubs/components/ClubMember"
import EditClubModal from "@features/clubs/components/EditClubModal"
import { Linking } from "react-native"

const LINK_CONFIG: Record<ClubLink, {
    icon: typeof Instagram
    label: string
    toUrl: (value: string) => string
}> = {
    INSTAGRAM: {
        icon: Instagram,
        label: "Instagram",
        toUrl: (handle) => `https://instagram.com/${handle.replace(/^@/, "")}`,
    },
    X: {
        icon: Globe,
        label: "X",
        toUrl: (handle) => `https://x.com/${handle.replace(/^@/, "")}`,
    },
    WEBSITE: {
        icon: Globe,
        label: "Website",
        toUrl: (url) => url,
    },
    LINKED_IN: {
        icon: Linkedin,
        label: "LinkedIn",
        toUrl: (handle) => `https://linkedin.com/in/${handle}`,
    },
}

/**
 * Club detail screen.
 *
 * @author AJ Kneisl
 */
export default function ClubDetailScreen() {
    const { name } = useLocalSearchParams<{ name: string }>()

    const router = useRouter()
    const queryClient = useQueryClient()
    const user = useUser()
    const colors = useThemeColors()

    const [joinLoading, setJoinLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [editOpen, setEditOpen] = useState(false)

    const { data, isLoading, isError, refetch } = useQuery<ClubResponse>({
        queryKey: ["club", name],
        enabled: !!name,
        queryFn: async () => await get(`/clubs/${name}`)
    })

    const { data: members, isLoading: membersLoading } = useQuery<
        PaginatedResponse<ClubMemberResponse>
    >({
        queryKey: ["clubMembers", name, 1],
        enabled: !!name,
        queryFn: async () =>
            await get(`/clubs/${name}/members`, { query: { page: 1 } })
    })

    const { data: burrows } = useQuery<BurrowResponse[]>({
        queryKey: ["clubBurrows", name],
        enabled: !!name,
        queryFn: async () => await get(`/clubs/${name}/burrows`)
    })

    const isOwner = user !== null && user.id === data?.club?.ownerID
    const isMember = data?.membership !== null
    const isAdmin = data?.membership?.role === "ADMINISTRATOR" || isOwner

    // club members in order of their role
    const sortedMembers = useMemo(() => {
        if (!members?.contents) return []

        return [...members.contents].sort(
            (a, b) =>
                (ROLE_ORDER[a.member.role] ?? 3) -
                (ROLE_ORDER[b.member.role] ?? 3)
        )
    }, [members])

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

    // on join / leave
    const handleJoinLeave = async () => {
        if (!name || !user) return
        setJoinLoading(true)

        try {
            if (isMember) {
                await post(`/clubs/${name}/leave`)

                void queryClient.invalidateQueries({ queryKey: ["club", name] })
                void queryClient.invalidateQueries({
                    queryKey: ["clubMembers", name]
                })
            } else if (data?.requestedToJoin) {
                await del(`/clubs/${name}/requests`)

                queryClient.setQueryData<ClubResponse>(["club", name], (old) =>
                    old ? { ...old, requestedToJoin: false } : old
                )
            } else {
                await post(`/clubs/${name}/join`)

                if (data?.club?.requestToJoin) {
                    queryClient.setQueryData<ClubResponse>(
                        ["club", name],
                        (old) => (old ? { ...old, requestedToJoin: true } : old)
                    )
                    Toast.show({ type: "success", text1: "Request sent!" })
                } else {
                    void queryClient.invalidateQueries({
                        queryKey: ["club", name]
                    })
                    void queryClient.invalidateQueries({
                        queryKey: ["clubMembers", name]
                    })
                }
            }
        } catch (err) {
            Toast.show({
                type: "error",
                text1: typeof err === "string" ? err : "An error occurred"
            })
        } finally {
            setJoinLoading(false)
        }
    }

    const joinButtonText = useMemo(() => {
        if (isMember) return "Leave"
        if (data?.requestedToJoin) return "Cancel Request"
        return data?.club?.requestToJoin ? "Request to Join" : "Join"
    }, [isMember, data?.requestedToJoin, data?.club?.requestToJoin])

    const isDestructive =
        joinButtonText === "Leave" || joinButtonText === "Cancel Request"

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
                            {!isOwner && (
                                <Button
                                    variant={
                                        isDestructive ? "danger" : "success"
                                    }
                                    size="sm"
                                    onPress={handleJoinLeave}
                                    disabled={!user}
                                    loading={joinLoading}
                                >
                                    {joinButtonText}
                                </Button>
                            )}

                            {isAdmin && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onPress={() => setEditOpen(true)}
                                >
                                    <View className="flex-row items-center gap-1.5">
                                        <Pencil size={14} color={colors.text} />
                                        <Text className="text-text font-semibold text-sm">
                                            Edit
                                        </Text>
                                    </View>
                                </Button>
                            )}

                            {isOwner && (
                                <View className="bg-primary/15 rounded-full px-3 py-1">
                                    <Text className="text-primary text-xs font-semibold">
                                        Owner
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View className="px-4 py-5 gap-5">
                    {/* About */}
                    <Card>
                        <Text className="text-text font-semibold text-sm mb-2">
                            About
                        </Text>
                        <Text className="text-text opacity-70 text-sm leading-5">
                            {club.description || "No description provided."}
                        </Text>

                        {Object.keys(club.links ?? {}).length > 0 && (
                            <View className="flex-row flex-wrap gap-2 mt-3">
                                {(Object.entries(club.links ?? {}) as [ClubLink, string][]).map(([type, value]) => {
                                    const config = LINK_CONFIG[type]
                                    if (!config) return null
                                    const Icon = config.icon

                                    return (
                                        <Pressable
                                            key={type}
                                            onPress={() => Linking.openURL(config.toUrl(value))}
                                            className="flex-row items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5"
                                        >
                                            <Icon size={14} color={colors.text} style={{ opacity: 0.6 }} />
                                            <Text className="text-text opacity-70 text-xs font-medium">
                                                {config.label}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        )}
                    </Card>

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

                    {/* Members */}
                    <Card>
                        <Text className="text-text font-semibold text-sm mb-3">
                            Members
                        </Text>

                        {membersLoading && (
                            <Text className="text-text opacity-50 text-sm">
                                Loading members...
                            </Text>
                        )}

                        {!membersLoading && sortedMembers.length === 0 && (
                            <Text className="text-text opacity-50 text-sm">
                                No members yet.
                            </Text>
                        )}

                        {!membersLoading && sortedMembers.length > 0 && (
                            <View className="gap-3">
                                {sortedMembers.map((m) => (
                                    <ClubMember
                                        key={m.member.userID}
                                        data={m}
                                        isSelf={user?.id === m.member.userID}
                                        isClubOwner={
                                            m.member.userID === club.ownerID
                                        }
                                    />
                                ))}

                                {members && members.totalPages > 1 && (
                                    <Text className="text-text opacity-40 text-xs text-center mt-2">
                                        Showing page 1 of {members.totalPages}
                                    </Text>
                                )}
                            </View>
                        )}
                    </Card>
                </View>

                {/* Bottom spacing */}
                <View className="h-12" />
            </ScrollView>

            {isAdmin && (
                <EditClubModal
                    visible={editOpen}
                    onClose={() => setEditOpen(false)}
                    club={club}
                />
            )}
        </SafeAreaView>
    )
}
