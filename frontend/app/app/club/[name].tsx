import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Image
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useCallback } from "react"
import {
    ChevronLeft,
    Users,
    Shield,
    Crown,
    UserRound,
    CalendarClock,
    Calendar
} from "lucide-react-native"
import { get, post, del } from "@api/api"
import { CDN_URL, formatTimeAgo } from "@api/util"
import { NOT_REOCCURRING } from "@features/burrows/burrows.types"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import type { PaginatedResponse } from "@api/api.types"
import useUser from "@features/auth/hooks/useUser"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import { UpcomingBurrowCard } from "@features/home/components/UpcomingBurrowCard"
import { Button, Card } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import Toast from "react-native-toast-message"
import type { ClubRole, ClubResponse, ClubMemberResponse } from "@features/clubs/club.types"
import { ROLE_ORDER } from "@features/clubs/club.types"

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
        queryFn: async () => await get(`/clubs/${name}/members`, { query: { page: 1 } })
    })

    const { data: burrows } = useQuery<BurrowResponse[]>({
        queryKey: ["clubBurrows", name],
        enabled: !!name,
        queryFn: async () => await get(`/clubs/${name}/burrows`)
    })

    const isOwner = user !== null && user.id === data?.club?.ownerID
    const isMember = data?.membership !== null
    const isAdmin = data?.membership?.role === "ADMINISTRATOR" || isOwner

    const sortedMembers = useMemo(() => {
        if (!members?.contents) return []
        return [...members.contents].sort(
            (a, b) => (ROLE_ORDER[a.member.role] ?? 3) - (ROLE_ORDER[b.member.role] ?? 3)
        )
    }, [members])

    const reoccurringBurrows = useMemo(
        () => (burrows ?? []).filter((b) => b.burrow.reoccurring !== NOT_REOCCURRING),
        [burrows]
    )

    const upcomingBurrows = useMemo(
        () => (burrows ?? []).filter((b) => b.burrow.reoccurring === NOT_REOCCURRING),
        [burrows]
    )

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([
            refetch(),
            queryClient.invalidateQueries({ queryKey: ["clubMembers", name] }),
            queryClient.invalidateQueries({ queryKey: ["clubBurrows", name] })
        ])
        setRefreshing(false)
    }, [name, refetch, queryClient])

    const handleJoinLeave = async () => {
        if (!name || !user) return
        setJoinLoading(true)

        try {
            if (isMember) {
                await post(`/clubs/${name}/leave`)
                void queryClient.invalidateQueries({ queryKey: ["club", name] })
                void queryClient.invalidateQueries({ queryKey: ["clubMembers", name] })
            } else if (data?.requestedToJoin) {
                await del(`/clubs/${name}/requests`)
                queryClient.setQueryData<ClubResponse>(["club", name], (old) =>
                    old ? { ...old, requestedToJoin: false } : old
                )
            } else {
                await post(`/clubs/${name}/join`)
                if (data?.club?.requestToJoin) {
                    queryClient.setQueryData<ClubResponse>(["club", name], (old) =>
                        old ? { ...old, requestedToJoin: true } : old
                    )
                    Toast.show({ type: "success", text1: "Request sent!" })
                } else {
                    void queryClient.invalidateQueries({ queryKey: ["club", name] })
                    void queryClient.invalidateQueries({ queryKey: ["clubMembers", name] })
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

    const isDestructive = joinButtonText === "Leave" || joinButtonText === "Cancel Request"

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
                <Text className="text-text font-semibold text-lg flex-1" numberOfLines={1}>
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
                    <ClubBannerImage clubID={club.id} />

                    <View className="px-6 pb-5">
                        {/* Avatar overlapping banner */}
                        <View className="-mt-10 mb-3">
                            <ClubAvatar
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
                            <Users size={14} color={colors.text} style={{ opacity: 0.6 }} />
                            <Text className="text-text opacity-60 text-sm">
                                {data.memberCount} member{data.memberCount !== 1 ? "s" : ""}
                            </Text>
                        </View>

                        {/* Actions */}
                        <View className="flex-row items-center gap-2 mt-4">
                            {!isOwner && (
                                <Button
                                    variant={isDestructive ? "danger" : "success"}
                                    size="sm"
                                    onPress={handleJoinLeave}
                                    disabled={!user}
                                    loading={joinLoading}
                                >
                                    {joinButtonText}
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
                        <Text className="text-text font-semibold text-sm mb-2">About</Text>
                        <Text className="text-text opacity-70 text-sm leading-5">
                            {club.description || "No description provided."}
                        </Text>
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
                        <Text className="text-text font-semibold text-sm mb-3">Members</Text>

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
                                    <MemberRow
                                        key={m.member.userID}
                                        data={m}
                                        isSelf={user?.id === m.member.userID}
                                        isClubOwner={m.member.userID === club.ownerID}
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
        </SafeAreaView>
    )
}

function ClubBannerImage({ clubID }: { clubID: string }) {
    const colors = useThemeColors()
    const [error, setError] = useState(false)
    const uri = `${CDN_URL}/avatars/club/${clubID}/banner`

    if (error) {
        return (
            <View
                className="h-32 w-full"
                style={{ backgroundColor: colors.primary + "20" }}
            />
        )
    }

    return (
        <Image
            source={{ uri }}
            className="h-32 w-full"
            resizeMode="cover"
            onError={() => setError(true)}
        />
    )
}

function ClubAvatar({
    clubID,
    displayName,
    size
}: {
    clubID: string
    displayName: string
    size: number
}) {
    const colors = useThemeColors()
    const [error, setError] = useState(false)
    const uri = `${CDN_URL}/avatars/club/${clubID}/avatar`

    const initials = useMemo(
        () =>
            displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join(""),
        [displayName]
    )

    return (
        <View
            className={`rounded-full overflow-hidden shadow-lg ${size > 48 ? "border-4" : "border-2"} border-background`}
            style={{ width: size, height: size }}
        >
            {!error ? (
                <Image
                    source={{ uri }}
                    style={{ width: size, height: size }}
                    onError={() => setError(true)}
                />
            ) : (
                <View
                    className="items-center justify-center"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: colors.primary
                    }}
                >
                    <Text className="text-white font-bold text-2xl">{initials}</Text>
                </View>
            )}
        </View>
    )
}

function RoleBadge({ role, roleName }: { role: ClubRole; roleName?: string }) {
    const colors = useThemeColors()

    const config = {
        ADMINISTRATOR: {
            icon: Crown,
            bg: "#FEF3C7",
            text: "#92400E",
            label: "Administrator"
        },
        MODERATOR: {
            icon: Shield,
            bg: "#E0E7FF",
            text: "#3730A3",
            label: "Moderator"
        },
        MEMBER: {
            icon: UserRound,
            bg: colors.card,
            text: colors.text,
            label: "Member"
        }
    }

    const c = config[role]
    const Icon = c.icon
    const label = roleName || c.label

    return (
        <View
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: c.bg }}
        >
            <Icon size={12} color={c.text} />
            <Text style={{ color: c.text, fontSize: 11, fontWeight: "600" }}>
                {label}
            </Text>
        </View>
    )
}

function MemberRow({
    data,
    isSelf,
    isClubOwner
}: {
    data: ClubMemberResponse
    isSelf: boolean
    isClubOwner: boolean
}) {
    const router = useRouter()
    const { member, user, profile } = data

    return (
        <Pressable
            onPress={() => router.push(`/user/${user.username}` as any)}
            className="flex-row items-center justify-between active:opacity-70"
        >
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <ProfilePicture
                    name={profile.name}
                    userID={profile.userID}
                    size="sm"
                />

                <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1">
                        <Text
                            className="text-text text-sm font-semibold"
                            numberOfLines={1}
                        >
                            {profile.name}
                        </Text>
                        {isSelf && (
                            <Text className="text-text opacity-50 text-[10px]">
                                (you)
                            </Text>
                        )}
                    </View>
                    <Text className="text-text opacity-50 text-xs">
                        @{user.username}
                    </Text>
                    <Text className="text-text opacity-40 text-[10px]">
                        Joined {formatTimeAgo(member.joinedAt)}
                    </Text>
                </View>
            </View>

            <RoleBadge role={member.role} roleName={member.roleName} />
        </Pressable>
    )
}
