import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Linking,
    Alert
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import {
    getUserByUsername,
    followUser,
    unfollowUser
} from "@features/auth/user.api"
import { Header } from "@features/layout/components"
import { Card, Button } from "@components/core"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import {
    Calendar,
    Mail,
    Users,
    UserPlus,
    UserMinus,
    ChevronLeft,
    Instagram,
    Linkedin
} from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * User profile screen
 *
 * @author AJ Kneisl
 */
export default function UserProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const { data, isLoading, error } = useQuery({
        queryKey: ["user", username],
        queryFn: () => getUserByUsername(username!),
        enabled: !!username
    })

    // follow mutation
    const followMutation = useMutation({
        mutationFn: followUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["user", username]
            })
            await queryClient.invalidateQueries({ queryKey: ["relations"] })

            Toast.show({
                type: "success",
                text1: "Followed successfully"
            })
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to follow",
                text2: error.message || "Please try again"
            })
        }
    })

    /// unfollow mutation
    const unfollowMutation = useMutation({
        mutationFn: unfollowUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["user", username]
            })
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

    const BackButton = (
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color={colors.text} />
        </Pressable>
    )

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Header
                    title="Profile"
                    showSearch={false}
                    showNotifications={false}
                    leftAction={BackButton}
                />

                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text dark:text-text opacity-60 mt-4">
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error || !data) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Header
                    title="Profile"
                    showSearch={false}
                    showNotifications={false}
                    leftAction={BackButton}
                />
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-text dark:text-text opacity-60 text-lg">
                        User not found
                    </Text>

                    <Text className="text-text dark:text-text opacity-50 text-sm mt-2">
                        This user doesn't exist or their profile is private
                    </Text>

                    <Button
                        variant="primary"
                        onPress={() => router.back()}
                        className="mt-6"
                    >
                        Go Back
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    const { user, profile, following } = data
    const isFollowing = following.youFollow

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header
                title={`@${user.username}`}
                showSearch={false}
                showNotifications={false}
                leftAction={BackButton}
            />

            <ScrollView className="flex-1 px-6 py-4">
                {/* Profile Header */}
                <View className="items-center mb-6">
                    {/* Avatar */}
                    <View className="mb-4">
                        <ProfilePicture
                            name={profile.name || user.username}
                            userID={user.id}
                            size="xl"
                        />
                    </View>

                    {/* Name & Username */}
                    <Text className="text-2xl font-bold text-text">
                        {profile.name || user.username}
                    </Text>
                    <Text className="text-text dark:text-text opacity-60 mt-1">@{user.username}</Text>

                    {/* Follow/Following Stats */}
                    <View className="flex-row gap-4 mt-4">
                        <View className="items-center">
                            <Text className="text-lg font-bold text-text">
                                {following.following}
                            </Text>
                            <Text className="text-sm text-text dark:text-text opacity-60">
                                Following
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-lg font-bold text-text">
                                {following.followers}
                            </Text>
                            <Text className="text-sm text-text dark:text-text opacity-60">
                                Followers
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-lg font-bold text-text">
                                {following.mutuals}
                            </Text>
                            <Text className="text-sm text-text dark:text-text opacity-60">
                                Mutuals
                            </Text>
                        </View>
                    </View>

                    {/* Follow/Unfollow Button */}
                    <Button
                        variant={isFollowing ? "outline" : "primary"}
                        size="sm"
                        onPress={() => {
                            if (isFollowing) {
                                unfollowMutation.mutate(user.id)
                            } else {
                                followMutation.mutate(user.id)
                            }
                        }}
                        leftIcon={
                            isFollowing ? (
                                <UserMinus size={16} color={colors.primary} />
                            ) : (
                                <UserPlus size={16} color="#FFFFFF" />
                            )
                        }
                        loading={
                            followMutation.isPending ||
                            unfollowMutation.isPending
                        }
                        className="mt-4"
                    >
                        {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                </View>

                {/* Stats */}
                <View className="flex-row gap-3 mb-6">
                    <Card variant="bordered" className="flex-1">
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-text">
                                {data.recentHostedBurrows?.length || 0}
                            </Text>
                            <Text className="text-sm text-text dark:text-text opacity-60">
                                Hosted
                            </Text>
                        </View>
                    </Card>
                    <Card variant="bordered" className="flex-1">
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-text">
                                {data.recentJoinedBurrows?.length || 0}
                            </Text>
                            <Text className="text-sm text-text dark:text-text opacity-60">
                                Joined
                            </Text>
                        </View>
                    </Card>
                </View>

                {/* About Section */}
                {profile.bio && (
                    <Card variant="bordered" className="mb-4">
                        <Text className="text-lg font-semibold text-text mb-2">
                            About
                        </Text>
                        <Text className="text-text dark:text-text">{profile.bio}</Text>
                    </Card>
                )}

                {/* Info Section */}
                <Card variant="bordered" className="mb-4">
                    <Text className="text-lg font-semibold text-text mb-3">
                        Info
                    </Text>
                    <View className="space-y-3">
                        {profile.major && (
                            <InfoRow
                                icon={<Users size={18} color={colors.primary} />}
                                label="Major"
                                value={profile.major}
                            />
                        )}
                        {profile.gradYear && (
                            <InfoRow
                                icon={<Calendar size={18} color={colors.primary} />}
                                label="Graduation Year"
                                value={String(profile.gradYear)}
                            />
                        )}
                    </View>
                </Card>

                {/* Social Media Links */}
                {(profile.instagram || profile.linkedIn) && (
                    <Card variant="bordered" className="mb-4">
                        <Text className="text-lg font-semibold text-text mb-3">
                            Connect
                        </Text>
                        <View className="flex-row gap-3">
                            {profile.instagram && (
                                <SocialLink
                                    icon={<Instagram size={20} color="#E4405F" />}
                                    label="Instagram"
                                    url={formatInstagramUrl(profile.instagram)}
                                />
                            )}
                            {profile.linkedIn && (
                                <SocialLink
                                    icon={<Linkedin size={20} color="#0A66C2" />}
                                    label="LinkedIn"
                                    url={formatLinkedInUrl(profile.linkedIn)}
                                />
                            )}
                        </View>
                    </Card>
                )}

                {/* Recent Burrows */}
                {data.recentHostedBurrows &&
                    data.recentHostedBurrows.length > 0 && (
                        <Card variant="bordered" className="mb-20">
                            <Text className="text-lg font-semibold text-text mb-3">
                                Recent Burrows
                            </Text>
                            {data.recentHostedBurrows
                                .slice(0, 3)
                                .map((burrowResponse) => (
                                    <View
                                        key={burrowResponse.burrow.id}
                                        className="py-2 border-b border-card-border dark:border-card-border last:border-b-0"
                                    >
                                        <Text className="text-text font-semibold">
                                            {burrowResponse.burrow.title}
                                        </Text>
                                        <Text className="text-text dark:text-text opacity-60 text-sm">
                                            {burrowResponse.burrow.kind}
                                        </Text>
                                    </View>
                                ))}
                        </Card>
                    )}
            </ScrollView>
        </SafeAreaView>
    )
}

function InfoRow({
    icon,
    label,
    value
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <View className="flex-row items-center">
            <View className="mr-3">{icon}</View>
            <View className="flex-1">
                <Text className="text-xs text-text dark:text-text opacity-50 mb-0.5">{label}</Text>
                <Text className="text-base text-text">{value}</Text>
            </View>
        </View>
    )
}

function SocialLink({
    icon,
    label,
    url
}: {
    icon: React.ReactNode
    label: string
    url: string
}) {
    const handlePress = async () => {
        try {
            const supported = await Linking.canOpenURL(url)
            if (supported) {
                await Linking.openURL(url)
            } else {
                Alert.alert("Error", `Cannot open ${label} link`)
            }
        } catch (error) {
            Alert.alert("Error", `Failed to open ${label} link`)
        }
    }

    return (
        <Pressable
            onPress={handlePress}
            className="flex-1 bg-card border border-card-border rounded-lg p-4 items-center active:opacity-70"
        >
            <View className="mb-2">{icon}</View>
            <Text className="text-text text-sm font-medium">{label}</Text>
        </Pressable>
    )
}

function formatInstagramUrl(instagram: string): string {
    // Remove @ if present and any existing URL
    const username = instagram.replace(/^@/, "").replace(/.*instagram\.com\//, "")
    return `https://instagram.com/${username}`
}

function formatLinkedInUrl(linkedIn: string): string {
    // If it's already a full URL, return it
    if (linkedIn.startsWith("http")) {
        return linkedIn
    }
    // If it starts with linkedin.com, add https
    if (linkedIn.startsWith("linkedin.com")) {
        return `https://${linkedIn}`
    }
    // Otherwise, assume it's a username and construct the URL
    return `https://linkedin.com/in/${linkedIn}`
}
