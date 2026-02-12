import { useState, useMemo } from "react"
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Image
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import {
    ArrowLeft,
    Users,
    Crown,
    Shield,
    UserRound,
    Plus
} from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { get } from "@api/api"
import { CDN_URL } from "@api/util"
import type {
    ClubRole,
    MyClubResponse
} from "@features/clubs/club.types"
import { CreateClubModal } from "@features/clubs/components/CreateClubModal"
import { createClubModalOpen } from "@features/layout/layout.atom"

function roleBadgeConfig(role: ClubRole) {
    switch (role) {
        case "ADMINISTRATOR":
            return { bg: "bg-yellow-500/15", text: "text-yellow-600", Icon: Crown }
        case "MODERATOR":
            return { bg: "bg-indigo-500/15", text: "text-indigo-600", Icon: Shield }
        default:
            return { bg: "bg-gray-500/15", text: "text-gray-600", Icon: UserRound }
    }
}

/**
 * My Clubs settings screen — shows clubs the user is a member of.
 *
 * @author AJ Kneisl
 */
export default function MyClubsScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const [, setCreateClubOpen] = useAtom(createClubModalOpen)

    const { data: clubs, isLoading } = useQuery<MyClubResponse[]>({
        queryKey: ["clubs", "mine"],
        queryFn: async () => await get("/clubs/mine")
    })

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <CreateClubModal />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 mr-2 -ml-2"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <View className="flex-1">
                    <Text className="text-2xl font-bold text-text">
                        My Clubs
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        {clubs?.length ?? 0} club
                        {clubs?.length !== 1 ? "s" : ""}
                    </Text>
                </View>

                <Pressable
                    onPress={() => setCreateClubOpen(true)}
                    className="bg-primary rounded-full px-4 py-2 flex-row items-center gap-1.5"
                >
                    <Plus size={16} color="#FFFFFF" strokeWidth={3} />
                    <Text className="text-white font-semibold text-sm">
                        Create
                    </Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {isLoading ? (
                    <View className="items-center justify-center py-12">
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>
                ) : !clubs || clubs.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <Users
                            size={48}
                            color={colors.text}
                            style={{ opacity: 0.3 }}
                        />
                        <Text className="text-text text-opacity-60 text-center mt-4">
                            You're not in any clubs yet
                        </Text>
                        <Text className="text-text text-opacity-40 text-center text-sm mt-2">
                            Browse clubs to find one to join
                        </Text>
                    </View>
                ) : (
                    <View className="gap-3">
                        {clubs.map((item) => (
                            <MyClubCard
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

                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}

function MyClubCard({
    item,
    onPress
}: {
    item: MyClubResponse
    onPress: () => void
}) {
    const [imageError, setImageError] = useState(false)
    const badge = roleBadgeConfig(item.membership.role)
    const BadgeIcon = badge.Icon

    const initials = useMemo(
        () =>
            item.club.displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join(""),
        [item.club.displayName]
    )

    return (
        <Pressable
            onPress={onPress}
            className="bg-card rounded-2xl border border-card-border p-4 flex-row items-center gap-3 active:opacity-80"
        >
            {/* Avatar */}
            <View className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 items-center justify-center">
                {!imageError ? (
                    <Image
                        source={{
                            uri: `${CDN_URL}/avatars/club/${item.club.id}/avatar`
                        }}
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
                <Text
                    className="text-text font-semibold text-base"
                    numberOfLines={1}
                >
                    {item.club.displayName}
                </Text>

                <Text className="text-text opacity-40 text-xs">
                    /club/{item.club.name}
                </Text>

                {item.club.description ? (
                    <Text
                        className="text-text opacity-60 text-sm mt-1"
                        numberOfLines={1}
                    >
                        {item.club.description}
                    </Text>
                ) : null}
            </View>

            {/* Role Badge */}
            <View
                className={`${badge.bg} rounded-full px-2.5 py-1 flex-row items-center gap-1`}
            >
                <BadgeIcon size={12} color="currentColor" className={badge.text} />
                <Text className={`${badge.text} text-xs font-semibold`}>
                    {item.membership.roleName || item.membership.role}
                </Text>
            </View>
        </Pressable>
    )
}
