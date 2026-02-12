import { View, Text, Pressable, Linking, Alert } from "react-native"
import { Image } from "expo-image"
import {
    Calendar,
    Users,
    Instagram,
    Linkedin,
    GraduationCap
} from "lucide-react-native"
import { Card } from "@components/core"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import { UserBadge } from "@components/profile/UserBadge"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { User } from "@features/auth/user.types"
import type { Profile, Following } from "@features/profile/profile.model"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import TABadge from "@features/burrows/components/TABadge"

/**
 * {@link UserProfileView}
 */
type UserProfileViewProps = {
    user: User
    profile: Profile
    following?: Following
    hostedBurrows?: BurrowResponse[]
    joinedBurrows?: BurrowResponse[]
    actionButton?: React.ReactNode
    isTa?: boolean
}

/**
 * View a user.
 *
 * @param user The user.
 * @param profile The {@link user}'s profile.
 * @param following The {@link user}'s following information.
 * @param hostedBurrows The user's recent Burrows.
 * @param joinedBurrows The user's joined Burrows.
 * @param actionButton An action button.
 * @param isTa If {@link user} is a TA.
 */
export function UserProfileView({
    user,
    profile,
    following,
    hostedBurrows,
    joinedBurrows,
    actionButton,
    isTa
}: UserProfileViewProps) {
    const colors = useThemeColors()

    return (
        <>
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

                <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-text text-opacity-60">
                        @{user.username}
                    </Text>

                    {/* TA badge */}
                    {isTa && <TABadge />}
                </View>

                {profile.badges.length > 0 && (
                    <View className="flex flex-row gap-2 mt-4">
                        {profile.badges.map(({ id, description }) => (
                            <UserBadge
                                key={id}
                                id={id}
                                description={description}
                            />
                        ))}
                    </View>
                )}

                {/* Follow/Following Stats */}
                {following && (
                    <View className="flex-row gap-6 mt-4">
                        <View className="items-center">
                            <Text className="text-lg font-bold text-text">
                                {following.following}
                            </Text>

                            <Text className="text-sm text-text text-opacity-60">
                                Following
                            </Text>
                        </View>

                        <View className="items-center">
                            <Text className="text-lg font-bold text-text">
                                {following.followers}
                            </Text>

                            <Text className="text-sm text-text text-opacity-60">
                                Followers
                            </Text>
                        </View>
                    </View>
                )}

                {/* Action Button (Edit or Follow/Unfollow) */}
                {actionButton}

                {/* Mutuals */}
                {following && following.mutuals > 0 && (
                    <Text className="text-text text-opacity-50 text-sm mt-2">
                        {following.mutuals} mutual friend
                        {following.mutuals !== 1 ? "s" : ""}
                    </Text>
                )}
            </View>

            {/* About Section */}
            <Card variant="bordered" className="mb-4">
                <Text className="text-lg font-semibold text-text mb-2">
                    About
                </Text>

                <Text className="text-text text-opacity-80">
                    {profile.bio || "No description."}
                </Text>
            </Card>

            {/* Info Section */}
            {(profile.major || profile.gradYear) && (
                <Card variant="bordered" className="mb-4">
                    <Text className="text-lg font-semibold text-text mb-3">
                        Info
                    </Text>

                    <View className="gap-3">
                        {profile.major && (
                            <InfoRow
                                icon={
                                    <Users size={18} color={colors.primary} />
                                }
                                label="Major"
                                value={profile.major}
                            />
                        )}

                        {profile.gradYear && (
                            <InfoRow
                                icon={
                                    <Calendar
                                        size={18}
                                        color={colors.primary}
                                    />
                                }
                                label="Year"
                                value={String(profile.gradYear)}
                            />
                        )}
                    </View>
                </Card>
            )}

            {/* Social Media Links */}
            {(profile.instagram || profile.linkedIn) && (
                <View className="flex-row gap-3 mb-4">
                    {profile.instagram && (
                        <SocialButton
                            icon={<Instagram size={18} color="#E4405F" />}
                            label="Instagram"
                            url={formatInstagramUrl(profile.instagram)}
                        />
                    )}

                    {profile.linkedIn && (
                        <SocialButton
                            icon={<Linkedin size={18} color="#0A66C2" />}
                            label="LinkedIn"
                            url={formatLinkedInUrl(profile.linkedIn)}
                        />
                    )}
                </View>
            )}

            {/* Hosted Burrows */}
            {hostedBurrows && hostedBurrows.length > 0 && (
                <View className="my-4">
                    <Text className="text-lg font-semibold text-text mb-3">
                        Hosted Burrows
                    </Text>

                    {hostedBurrows.slice(0, 3).map((burrowResponse) => (
                        <UpcomingBurrowCard
                            key={burrowResponse.burrow.id}
                            burrowResponse={burrowResponse}
                        />
                    ))}
                </View>
            )}

            {/* Joined Burrows */}
            {joinedBurrows && joinedBurrows.length > 0 && (
                <View className="my-4">
                    <Text className="text-lg font-semibold text-text mb-3">
                        Joined Burrows
                    </Text>

                    {joinedBurrows.slice(0, 3).map((burrowResponse) => (
                        <UpcomingBurrowCard
                            key={burrowResponse.burrow.id}
                            burrowResponse={burrowResponse}
                        />
                    ))}
                </View>
            )}
        </>
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
                <Text className="text-xs text-text text-opacity-60 mb-0.5">
                    {label}
                </Text>
                <Text className="text-base text-text">{value}</Text>
            </View>
        </View>
    )
}

function SocialButton({
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
        } catch {
            Alert.alert("Error", `Failed to open ${label} link`)
        }
    }

    return (
        <Pressable
            onPress={handlePress}
            className="flex-1 flex-row items-center justify-center gap-2 bg-card border border-card-border rounded-full py-3 px-4 active:opacity-70"
        >
            {icon}
            <Text className="text-text text-sm font-medium">{label}</Text>
        </Pressable>
    )
}

function formatInstagramUrl(instagram: string): string {
    const username = instagram
        .replace(/^@/, "")
        .replace(/.*instagram\.com\//, "")
    return `https://instagram.com/${username}`
}

function formatLinkedInUrl(linkedIn: string): string {
    if (linkedIn.startsWith("http")) {
        return linkedIn
    }
    if (linkedIn.startsWith("linkedin.com")) {
        return `https://${linkedIn}`
    }
    return `https://linkedin.com/in/${linkedIn}`
}
