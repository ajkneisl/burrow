import type { Relation } from "@umnburrow/core/api"
import { View, SectionList, ScrollView, RefreshControl } from "react-native"
import { useMemo } from "react"
import { Users, UserMinus, UserPlus } from "lucide-react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"

import {
    useFriendsQuery,
    useFollowingQuery,
    useFollowersQuery,
    useFollowMutation,
    useUnfollowMutation
} from "../relations.queries"
import UserCard from "./UserCard"

type RelationKind = "friend" | "following" | "follower"

type RelationSection = {
    title: string
    kind: RelationKind
    data: Relation[]
}

/**
 * The default Friends view — everyone you're connected to in one list,
 * sectioned by relation. The chips filter down to a single relation.
 *
 * @author AJ Kneisl
 */
export default function AllRelationsTab() {
    const colors = useThemeColors()

    const friendsQuery = useFriendsQuery()
    const followingQuery = useFollowingQuery()
    const followersQuery = useFollowersQuery()

    const follow = useFollowMutation()
    const unfollow = useUnfollowMutation()

    const isLoading =
        friendsQuery.isLoading ||
        followingQuery.isLoading ||
        followersQuery.isLoading

    const isRefetching =
        friendsQuery.isRefetching ||
        followingQuery.isRefetching ||
        followersQuery.isRefetching

    const refetchAll = () => {
        void friendsQuery.refetch()
        void followingQuery.refetch()
        void followersQuery.refetch()
    }

    const sections = useMemo(() => {
        const friends = friendsQuery.data ?? []
        const friendIds = new Set(friends.map((f) => f.userID))

        // friends are mutuals — don't repeat them in the other sections
        const following = (followingQuery.data ?? []).filter(
            (u) => !friendIds.has(u.userID)
        )
        const followers = (followersQuery.data ?? []).filter(
            (u) => !friendIds.has(u.userID)
        )

        const result: RelationSection[] = []
        if (friends.length > 0)
            result.push({ title: "Friends", kind: "friend", data: friends })
        if (following.length > 0)
            result.push({
                title: "Following",
                kind: "following",
                data: following
            })
        if (followers.length > 0)
            result.push({
                title: "Followers",
                kind: "follower",
                data: followers
            })

        return result
    }, [friendsQuery.data, followingQuery.data, followersQuery.data])

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text opacity-60">
                    Loading connections...
                </Text>
            </View>
        )
    }

    if (sections.length === 0) {
        return (
            <ScrollView
                contentContainerClassName="items-center justify-center py-12 px-6"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetchAll}
                    />
                }
            >
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text opacity-60 text-lg mt-4">
                    No connections yet
                </Text>
                <Text className="text-text opacity-40 text-sm mt-1 text-center">
                    Find other Gophers in Discover
                </Text>
            </ScrollView>
        )
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item, index) => `${item.userID}-${index}`}
            renderSectionHeader={({ section }) => (
                <View className="flex-row items-center gap-3 mb-3 mt-2 bg-background">
                    <Text className="text-xs font-semibold text-text opacity-60 uppercase tracking-wider">
                        {section.title}
                    </Text>
                    <View className="flex-1 h-px bg-text opacity-10" />
                </View>
            )}
            renderItem={({ item, section }) => (
                <View className="mb-3">
                    <UserCard
                        userID={item.userID}
                        name={item.name}
                        username={item.username}
                        action={
                            section.kind === "friend"
                                ? {
                                      label: "Unfriend",
                                      variant: "primary",
                                      icon: (
                                          <UserMinus
                                              size={14}
                                              color="#FFFFFF"
                                          />
                                      ),
                                      onPress: () =>
                                          unfollow.mutate(item.userID)
                                  }
                                : section.kind === "following"
                                  ? {
                                        label: "Unfollow",
                                        variant: "primary",
                                        icon: (
                                            <UserMinus
                                                size={14}
                                                color="#FFFFFF"
                                            />
                                        ),
                                        onPress: () =>
                                            unfollow.mutate(item.userID)
                                    }
                                  : {
                                        label: "Follow Back",
                                        variant: "primary",
                                        icon: (
                                            <UserPlus
                                                size={14}
                                                color="#FFFFFF"
                                            />
                                        ),
                                        onPress: () =>
                                            follow.mutate(item.userID)
                                    }
                        }
                    />
                </View>
            )}
            stickySectionHeadersEnabled={false}
            contentContainerClassName="px-6 pt-4 pb-24"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetchAll}
                />
            }
        />
    )
}
