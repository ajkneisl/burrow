import { View, Text, FlatList, Pressable, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Header } from "@features/layout/components"
import { Card, Button } from "@components/core"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import { Users, UserPlus, UserMinus } from "lucide-react-native"
import {
    getRelations,
    getDiscoveredUsers,
    followUser,
    unfollowUser
} from "@features/auth/user.api"
import type { Relation, DiscoveredUser } from "@features/auth/user.types"
import { useThemeColors } from "@api/theme/useThemeColors"

type TabType = "friends" | "following" | "followers" | "discover"

/**
 * Friends screen
 *
 * @author AJ Kneisl
 */
export default function FriendsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("friends")
    const queryClient = useQueryClient()

    // get friends (mutual follows)
    const friendsQuery = useQuery({
        queryKey: ["relations", "friends"],
        queryFn: () => getRelations("friends")
    })

    // get following (people I follow, excluding friends)
    const followingQuery = useQuery({
        queryKey: ["relations", "following"],
        queryFn: () => getRelations("following")
    })

    // get followers (people who follow me, excluding friends)
    const followersQuery = useQuery({
        queryKey: ["relations", "followers"],
        queryFn: () => getRelations("followers")
    })

    // get discovered
    const discoverQuery = useQuery({
        queryKey: ["relations", "discover"],
        queryFn: () => getDiscoveredUsers()
    })

    // Filter out friends from following and followers lists
    const friendIds = new Set((friendsQuery.data || []).map(f => f.userID))
    const filteredFollowing = (followingQuery.data || []).filter(u => !friendIds.has(u.userID))
    const filteredFollowers = (followersQuery.data || []).filter(u => !friendIds.has(u.userID))

    // unfollow a user
    const unfollowMutation = useMutation({
        mutationFn: unfollowUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["relations"] })

            Toast.show({
                type: "success",
                text1: "Unfollowed successfully"
            })
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to unfollow",
                text2: error.message || "Please try again"
            })
        }
    })

    // follow a user
    const followMutation = useMutation({
        mutationFn: followUser,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["relations"] })

            Toast.show({
                type: "success",
                text1: "Followed successfully"
            })
        },
        onError: async (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to follow",
                text2: error.message || "Please try again"
            })
        }
    })

    const handleRefresh = () => {
        if (activeTab === "friends") {
            friendsQuery.refetch()
        } else if (activeTab === "following") {
            followingQuery.refetch()
        } else if (activeTab === "followers") {
            followersQuery.refetch()
        } else {
            discoverQuery.refetch()
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Friends" />

            {/* tabs */}
            <View className="px-6 py-3 border-b border-card-border">
                <View className="flex-row gap-2">
                    <TabButton
                        label="Friends"
                        active={activeTab === "friends"}
                        onPress={() => setActiveTab("friends")}
                    />

                    <TabButton
                        label="Following"
                        active={activeTab === "following"}
                        onPress={() => setActiveTab("following")}
                    />

                    <TabButton
                        label="Followers"
                        active={activeTab === "followers"}
                        onPress={() => setActiveTab("followers")}
                    />

                    <TabButton
                        label="Discover"
                        active={activeTab === "discover"}
                        onPress={() => setActiveTab("discover")}
                    />
                </View>
            </View>

            {/* friends tab */}
            {activeTab === "friends" && (
                <FriendsTab
                    friends={friendsQuery.data || []}
                    isLoading={friendsQuery.isLoading}
                    isRefreshing={friendsQuery.isRefetching}
                    onRefresh={handleRefresh}
                    onUnfollow={(userId) => unfollowMutation.mutate(userId)}
                />
            )}

            {/* following tab */}
            {activeTab === "following" && (
                <FollowingTab
                    following={filteredFollowing}
                    isLoading={followingQuery.isLoading}
                    isRefreshing={followingQuery.isRefetching}
                    onRefresh={handleRefresh}
                    onUnfollow={(userId) => unfollowMutation.mutate(userId)}
                />
            )}

            {/* followers tab */}
            {activeTab === "followers" && (
                <FollowersTab
                    followers={filteredFollowers}
                    isLoading={followersQuery.isLoading}
                    isRefreshing={followersQuery.isRefetching}
                    onRefresh={handleRefresh}
                    onFollow={(userId) => followMutation.mutate(userId)}
                />
            )}

            {/* discover tab */}
            {activeTab === "discover" && (
                <DiscoverTab
                    users={discoverQuery.data || []}
                    isLoading={discoverQuery.isLoading}
                    isRefreshing={discoverQuery.isRefetching}
                    onRefresh={handleRefresh}
                    onFollow={(userId) => followMutation.mutate(userId)}
                />
            )}
        </SafeAreaView>
    )
}

function TabButton({
    label,
    active,
    onPress
}: {
    label: string
    active: boolean
    onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`px-4 py-2 rounded-full ${
                active ? "bg-primary dark:bg-primary" : "bg-card dark:bg-card"
            }`}
        >
            <Text
                className={`text-sm font-semibold ${
                    active ? "text-white" : "text-text dark:text-text"
                }`}
            >
                {label}
            </Text>
        </Pressable>
    )
}

function FriendsTab({
    friends,
    isLoading,
    isRefreshing,
    onRefresh,
    onUnfollow
}: {
    friends: Relation[]
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
    onUnfollow: (userId: string) => void
}) {
    const colors = useThemeColors()

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text text-opacity-60">
                    Loading friends...
                </Text>
            </View>
        )
    }

    if (friends.length === 0) {
        return (
            <View className="items-center justify-center py-12 px-6">
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text text-opacity-60 text-lg mt-4">
                    No friends yet
                </Text>
                <Text className="text-text text-opacity-40 text-sm mt-1 text-center">
                    Friends are people who follow each other
                </Text>
            </View>
        )
    }

    return (
        <FlatList
            data={friends}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <FriendCard user={item} onUnfollow={onUnfollow} />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 py-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                />
            }
        />
    )
}

function FollowingTab({
    following,
    isLoading,
    isRefreshing,
    onRefresh,
    onUnfollow
}: {
    following: Relation[]
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
    onUnfollow: (userId: string) => void
}) {
    const colors = useThemeColors()

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text text-opacity-60">
                    Loading following...
                </Text>
            </View>
        )
    }

    if (following.length === 0) {
        return (
            <View className="items-center justify-center py-12 px-6">
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text text-opacity-60 text-lg mt-4">
                    Not following anyone yet
                </Text>
                <Text className="text-text text-opacity-40 text-sm mt-1 text-center">
                    Discover and follow other Gophers in the Discover tab
                </Text>
            </View>
        )
    }

    return (
        <FlatList
            data={following}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <FollowingCard user={item} onUnfollow={onUnfollow} />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 py-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                />
            }
        />
    )
}

function FollowersTab({
    followers,
    isLoading,
    isRefreshing,
    onRefresh,
    onFollow
}: {
    followers: Relation[]
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
    onFollow: (userId: string) => void
}) {
    const colors = useThemeColors()

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text text-opacity-60">
                    Loading followers...
                </Text>
            </View>
        )
    }

    if (followers.length === 0) {
        return (
            <View className="items-center justify-center py-12 px-6">
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />
                <Text className="text-text text-opacity-60 text-lg mt-4">
                    No followers yet
                </Text>
                <Text className="text-text text-opacity-40 text-sm mt-1 text-center">
                    Share your profile to get more followers
                </Text>
            </View>
        )
    }

    return (
        <FlatList
            data={followers}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <FollowerCard user={item} onFollow={onFollow} />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 py-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                />
            }
        />
    )
}

function DiscoverTab({
    users,
    isLoading,
    isRefreshing,
    onRefresh,
    onFollow
}: {
    users: DiscoveredUser[]
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
    onFollow: (userId: string) => void
}) {
    const colors = useThemeColors()

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-text text-opacity-60">
                    Finding suggestions...
                </Text>
            </View>
        )
    }

    if (users.length === 0) {
        return (
            <View className="items-center justify-center py-12 px-6">
                <Users size={48} color={colors.text} style={{ opacity: 0.2 }} />

                <Text className="text-text text-opacity-60 text-lg mt-4">
                    No suggestions yet
                </Text>

                <Text className="text-text text-opacity-40 text-sm mt-1 text-center">
                    Join some Burrows to discover other Gophers
                </Text>
            </View>
        )
    }

    return (
        <FlatList
            data={users}
            keyExtractor={(item) => item.userID}
            renderItem={({ item }) => (
                <UserCard user={item} onFollow={onFollow} />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-6 py-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                />
            }
        />
    )
}

function FriendCard({
    user,
    onUnfollow
}: {
    user: Relation
    onUnfollow: (userId: string) => void
}) {
    return (
        <Card variant="bordered">
            <View className="flex-row items-center">
                <View className="mr-3">
                    <ProfilePicture
                        name={user.name || user.username}
                        userID={user.userID}
                        size="md"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-semibold">
                        {user.name || user.username}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm">
                        @{user.username}
                    </Text>
                </View>
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserMinus size={14} color="#666" />}
                    onPress={() => onUnfollow(user.userID)}
                >
                    Unfriend
                </Button>
            </View>
        </Card>
    )
}

function FollowingCard({
    user,
    onUnfollow
}: {
    user: Relation
    onUnfollow: (userId: string) => void
}) {
    return (
        <Card variant="bordered">
            <View className="flex-row items-center">
                <View className="mr-3">
                    <ProfilePicture
                        name={user.name || user.username}
                        userID={user.userID}
                        size="md"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-semibold">
                        {user.name || user.username}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm">
                        @{user.username}
                    </Text>
                </View>
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserMinus size={14} color="#666" />}
                    onPress={() => onUnfollow(user.userID)}
                >
                    Unfollow
                </Button>
            </View>
        </Card>
    )
}

function FollowerCard({
    user,
    onFollow
}: {
    user: Relation
    onFollow: (userId: string) => void
}) {
    const isFollowingBack = !!user.youFollowedAt

    return (
        <Card variant="bordered">
            <View className="flex-row items-center">
                <View className="mr-3">
                    <ProfilePicture
                        name={user.name || user.username}
                        userID={user.userID}
                        size="md"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-semibold">
                        {user.name || user.username}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm">
                        @{user.username}
                    </Text>
                    {isFollowingBack && (
                        <Text className="text-success text-xs mt-0.5">
                            Following each other
                        </Text>
                    )}
                </View>
                {!isFollowingBack && (
                    <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<UserPlus size={14} color="#FFFFFF" />}
                        onPress={() => onFollow(user.userID)}
                    >
                        Follow Back
                    </Button>
                )}
            </View>
        </Card>
    )
}

function UserCard({
    user,
    onFollow
}: {
    user: DiscoveredUser
    onFollow: (userId: string) => void
}) {
    return (
        <Card variant="bordered">
            <View className="flex-row items-center">
                <View className="mr-3">
                    <ProfilePicture
                        name={user.name || user.username}
                        userID={user.userID}
                        size="md"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-semibold">
                        {user.name || user.username}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm">
                        @{user.username}
                    </Text>
                    {user.reasoning && (
                        <Text className="text-text text-opacity-60 text-xs mt-1">
                            {user.reasoning === "SHARED_BURROW" &&
                                "In a burrow together"}
                            {user.reasoning === "FRIEND_FOLLOWS" &&
                                "Followed by a friend"}
                            {user.reasoning === "THEY_FOLLOW" && "Follows you"}
                            {user.reasoning === "SHARED_FRIEND" &&
                                "Mutual friends"}
                        </Text>
                    )}
                </View>
                <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus size={16} color="#FFFFFF" />}
                    onPress={() => onFollow(user.userID)}
                >
                    Follow
                </Button>
            </View>
        </Card>
    )
}
