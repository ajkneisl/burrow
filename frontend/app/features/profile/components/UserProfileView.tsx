import { View, Text } from "react-native"
import {
    Calendar,
    Users,
    Instagram,
    Linkedin,
    School,
    BookOpen
} from "lucide-react-native"
import { Card } from "@components/core"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import { UserBadge } from "@features/profile/components/UserBadge"
import { UpcomingBurrowCard } from "@features/burrows/components/UpcomingBurrowCard"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { User } from "@features/auth/user.types"
import type { Profile, Following } from "@features/profile/profile.model"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import TABadge from "@features/burrows/components/TABadge"
import {
    formatInstagramUrl,
    formatLinkedInUrl
} from "@features/profile/profile.util"
import ProfileSocialButton from "@features/profile/components/ProfileSocialButton"
import ProfileInfoRow from "@features/profile/components/ProfileInfoRow"

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
            <View className="items-center mb-6">
                {/* avatar  */}
                <View className="mb-4">
                    <ProfilePicture
                        name={profile.name || user.username}
                        userID={user.id}
                        size="xl"
                    />
                </View>

                {/* name / username */}
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

                {/* badges */}
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

                {/* follow / following */}
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

                {/* edit / unfollow, follow */}
                {actionButton}

                {/* mutual friend count */}
                {following && following.mutuals > 0 && (
                    <Text className="text-text text-opacity-50 text-sm mt-2">
                        {following.mutuals} mutual friend
                        {following.mutuals !== 1 ? "s" : ""}
                    </Text>
                )}
            </View>

            {/* about */}
            <Card variant="bordered" className="mb-4">
                <Text className="text-lg font-semibold text-text mb-2">
                    About
                </Text>

                <Text className="text-text text-opacity-80">
                    {profile.bio || "No description."}
                </Text>
            </Card>

            {/* Info Section */}
            {(profile.major ||
                profile.gradYear ||
                profile.school ||
                (profile.classes && profile.classes.length > 0)) && (
                <Card variant="bordered" className="mb-4">
                    <Text className="text-lg font-semibold text-text mb-3">
                        Info
                    </Text>

                    <View className="gap-3">
                        {/* school */}
                        {profile.school && (
                            <ProfileInfoRow
                                icon={
                                    <School size={18} color={colors.primary} />
                                }
                                label="School"
                                value={profile.school}
                            />
                        )}

                        {/* major */}
                        {profile.major && (
                            <ProfileInfoRow
                                icon={
                                    <Users size={18} color={colors.primary} />
                                }
                                label="Major"
                                value={profile.major}
                            />
                        )}

                        {/* classes */}
                        {profile.classes && profile.classes.length > 0 && (
                            <ProfileInfoRow
                                icon={
                                    <BookOpen
                                        size={18}
                                        color={colors.primary}
                                    />
                                }
                                label="Classes"
                                value={profile.classes.join(", ")}
                            />
                        )}

                        {/* graduation year */}
                        {profile.gradYear && (
                            <ProfileInfoRow
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

            {/* social media */}
            {(profile.instagram || profile.linkedIn) && (
                <View className="flex-row gap-3 mb-4">
                    {/* instagram */}
                    {profile.instagram && (
                        <ProfileSocialButton
                            icon={<Instagram size={18} color="#E4405F" />}
                            label="Instagram"
                            url={formatInstagramUrl(profile.instagram)}
                        />
                    )}

                    {/* linked in */}
                    {profile.linkedIn && (
                        <ProfileSocialButton
                            icon={<Linkedin size={18} color="#0A66C2" />}
                            label="LinkedIn"
                            url={formatLinkedInUrl(profile.linkedIn)}
                        />
                    )}
                </View>
            )}

            {/* hosted burrows */}
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

            {/* joined burrows */}
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
