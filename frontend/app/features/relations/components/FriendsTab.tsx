import { View, FlatList, ScrollView, RefreshControl } from "react-native"
import { Users, UserMinus } from "lucide-react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import { useFriendsQuery, useUnfollowMutation } from "../relations.queries"
import UserCard from "./UserCard"

export default function FriendsTab() {
    const colors = useThemeColors()
    const { data: friends = [], isLoading, isRefetching, refetch } = useFriendsQuery()
    const unfollow = useUnfollowMutation()

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text opacity-60">Loading friends...</Text>
            </View>
        )
    }

    if (friends.length === 0) {
        return (
            <ScrollView
                contentContainerClassName="items-center justify-center py-12 px-6"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
                }
            >
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text opacity-60 text-lg mt-4">No friends yet</Text>
                <Text className="text-text opacity-40 text-sm mt-1 text-center">
                    Friends are people who follow each other
                </Text>
            </ScrollView>
        )
    }

    return (
        <FlatList
            data={friends}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <UserCard
                    userID={item.userID}
                    name={item.name}
                    username={item.username}
                    action={{
                        label: "Unfriend",
                        variant: "primary",
                        icon: <UserMinus size={14} color="#FFFFFF" />,
                        onPress: () => unfollow.mutate(item.userID)
                    }}
                />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 py-4"
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
        />
    )
}
