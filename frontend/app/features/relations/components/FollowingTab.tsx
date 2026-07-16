import { View, FlatList, ScrollView, RefreshControl } from "react-native"
import { Users, UserMinus } from "lucide-react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    useFriendsQuery,
    useFollowingQuery,
    useUnfollowMutation
} from "../relations.queries"
import UserCard from "./UserCard"

export default function FollowingTab() {
    const colors = useThemeColors()
    const { data: friends = [] } = useFriendsQuery()
    const { data: following = [], isLoading, isRefetching, refetch } = useFollowingQuery()
    const unfollow = useUnfollowMutation()

    const friendIds = new Set(friends.map((f) => f.userID))
    const filtered = following.filter((u) => !friendIds.has(u.userID))

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text opacity-60">Loading following...</Text>
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
                <Text className="text-text opacity-60 text-lg mt-4">
                    Not following anyone yet
                </Text>
                <Text className="text-text opacity-40 text-sm mt-1 text-center">
                    Discover and follow other Gophers in the Discover tab
                </Text>
            </ScrollView>
        )
    }

    return (
        <FlatList
            data={filtered}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <UserCard
                    userID={item.userID}
                    name={item.name}
                    username={item.username}
                    action={{
                        label: "Unfollow",
                        variant: "primary",
                        icon: <UserMinus size={14} color="#FFFFFF" />,
                        onPress: () => unfollow.mutate(item.userID)
                    }}
                />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 pt-4 pb-24"
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
        />
    )
}
