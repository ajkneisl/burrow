import { View, FlatList, ScrollView, RefreshControl } from "react-native"
import { Users, UserPlus } from "lucide-react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    useFriendsQuery,
    useFollowersQuery,
    useFollowMutation
} from "../relations.queries"
import UserCard from "./UserCard"

export default function FollowersTab() {
    const colors = useThemeColors()
    const { data: friends = [] } = useFriendsQuery()
    const { data: followers = [], isLoading, isRefetching, refetch } = useFollowersQuery()
    const follow = useFollowMutation()

    const friendIds = new Set(friends.map((f) => f.userID))
    const filtered = followers.filter((u) => !friendIds.has(u.userID))

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text opacity-60">Loading followers...</Text>
            </View>
        )
    }

    if (filtered.length === 0) {
        return (
            <ScrollView
                contentContainerClassName="items-center justify-center py-12 px-6"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
                }
            >
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text opacity-60 text-lg mt-4">No followers yet</Text>
                <Text className="text-text opacity-40 text-sm mt-1 text-center">
                    Share your profile to get more followers
                </Text>
            </ScrollView>
        )
    }

    return (
        <FlatList
            data={filtered}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => {
                const isFollowingBack = !!item.youFollowedAt
                return (
                    <UserCard
                        userID={item.userID}
                        name={item.name}
                        username={item.username}
                        subtitle={
                            isFollowingBack ? "Following each other" : undefined
                        }
                        action={
                            !isFollowingBack
                                ? {
                                      label: "Follow Back",
                                      variant: "primary",
                                      icon: <UserPlus size={14} color="#FFFFFF" />,
                                      onPress: () => follow.mutate(item.userID)
                                  }
                                : undefined
                        }
                    />
                )
            }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 pt-4 pb-24"
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
        />
    )
}
