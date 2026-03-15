import { View, FlatList, ScrollView, RefreshControl } from "react-native"
import { Users, UserPlus } from "lucide-react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import { useDiscoverQuery, useFollowMutation } from "../relations.queries"
import UserCard from "./UserCard"
import type { DiscoverReasoning } from "@features/auth/user.types"

function getReasoningText(reasoning?: DiscoverReasoning) {
    switch (reasoning) {
        case "SHARED_BURROW":
            return "In a Burrow together"
        case "FRIEND_FOLLOWS":
            return "Followed by a friend"
        case "THEY_FOLLOW":
            return "Follows you"
        case "SHARED_FRIEND":
            return "Mutual friends"
        default:
            return undefined
    }
}

export default function DiscoverTab() {
    const colors = useThemeColors()
    const { data: users = [], isLoading, isRefetching, refetch } = useDiscoverQuery()
    const follow = useFollowMutation()

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text opacity-60">Finding suggestions...</Text>
            </View>
        )
    }

    if (users.length === 0) {
        return (
            <ScrollView
                contentContainerClassName="items-center justify-center py-12 px-6"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
                }
            >
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text opacity-60 text-lg mt-4">
                    No suggestions yet
                </Text>
                <Text className="text-text opacity-40 text-sm mt-1 text-center">
                    Join some Burrows to discover other Gophers
                </Text>
            </ScrollView>
        )
    }

    return (
        <FlatList
            data={users}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <UserCard
                    userID={item.userID}
                    name={item.name}
                    username={item.username}
                    subtitle={getReasoningText(item.reasoning)}
                    action={{
                        label: "Follow",
                        variant: "primary",
                        icon: <UserPlus size={14} color="#FFFFFF" />,
                        onPress: () => follow.mutate(item.userID)
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
