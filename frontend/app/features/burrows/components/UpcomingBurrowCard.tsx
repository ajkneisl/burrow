import { View, Pressable } from "react-native"
import { Chip, Text } from "@components/core"
import { useRouter } from "expo-router"
import { Clock, Check, Star, Bookmark, Repeat } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import useUser from "@features/auth/hooks/useUser"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import { CapacityBadge } from "@features/burrows/components/CapacityBadge"
import {
    BurrowResponse,
    getReoccurText,
    NOT_REOCCURRING
} from "@features/burrows/burrows.types"
import { formatDateTime } from "@api/util"
import KindChip from "@features/burrows/components/KindChip"
import TABadge from "@features/burrows/components/TABadge"
import LocationChip from "@features/burrows/components/LocationChip"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture"
import ThemedIcon from "@components/core/ThemedIcon"

/**
 * {@link UpcomingBurrowCard}
 */
type UpcomingBurrowCardProps = {
    burrowResponse: BurrowResponse
    verbose?: boolean
    actionBadge?: React.ReactNode
}

/**
 * A card for an upcoming Burrow.
 *
 * @param burrowResponse The Burrow response.
 * @param verbose If true, shows the description.
 * @param actionBadge optional action (used for remaking)
 *
 * @author AJ Kneisl
 */
export function UpcomingBurrowCard({
    burrowResponse,
    verbose = false,
    actionBadge
}: UpcomingBurrowCardProps) {
    const router = useRouter()
    const colors = useThemeColors()
    const user = useUser()
    const {
        burrow,
        joined,
        waiting,
        membership,
        bookmarked,
        burrowAuthorProfile,
        hostedByTa,
        clubName,
        clubDisplayName
    } = burrowResponse

    const isJoined = membership?.status === "JOINED"
    const isHost = user !== null && burrow.ownerID === user.id

    return (
        <Pressable
            onPress={() => router.push(`/burrow/${burrow.id}`)}
            className="mb-3"
        >
            <View className="bg-card border border-card-border rounded-2xl p-4">
                {/* header */}
                <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                        {/* title */}
                        <View className="flex-row items-center gap-1">
                            <Text
                                className="text-sm font-bold text-text"
                                numberOfLines={1}
                            >
                                {burrow.title}
                            </Text>

                            {isHost && (
                                <Text
                                    className="text-xs text-text"
                                    style={{ opacity: 0.6 }}
                                >
                                    · Hosting
                                </Text>
                            )}

                            {isJoined && !isHost && (
                                <Text
                                    className="text-xs text-text"
                                    style={{ opacity: 0.6 }}
                                >
                                    · Joined
                                </Text>
                            )}
                        </View>

                        {/*time*/}
                        {burrow.beginningTime && burrow.endTime && (
                            <View
                                className={`flex-row items-center gap-2 ${verbose && `mb-1`}`}
                            >
                                <ThemedIcon
                                    icon={
                                        burrow.reoccurring !== NOT_REOCCURRING
                                            ? Clock
                                            : Repeat
                                    }
                                    size={14}
                                    opacity={0.8}
                                />

                                <Text
                                    className="text-xs text-text"
                                    style={{ opacity: 0.8 }}
                                >
                                    {formatDateTime(
                                        burrow.beginningTime,
                                        burrow.endTime
                                    )}

                                    {verbose &&
                                        ` every ${getReoccurText(burrow.reoccurring)}`}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center gap-2">
                        {/* action badge */}
                        {actionBadge}

                        {/*bookmarked*/}
                        {bookmarked && (
                            <View
                                className="p-1.5 rounded-full"
                                style={{ backgroundColor: `${colors.info}1A` }}
                            >
                                <Bookmark
                                    size={14}
                                    color={colors.info}
                                    fill={colors.info}
                                />
                            </View>
                        )}

                        {/* author / club profile picture */}
                        {clubName && burrow.clubID ? (
                            <ClubProfilePicture
                                size="md"
                                clubID={burrow.clubID}
                                displayName={clubDisplayName ?? clubName}
                            />
                        ) : burrowAuthorProfile ? (
                            <ProfilePicture
                                name={burrowAuthorProfile.name}
                                userID={burrowAuthorProfile.userID}
                                size="md"
                            />
                        ) : null}
                    </View>
                </View>

                {/* description */}
                {verbose && burrow.description !== "" && (
                    <Text
                        className="text-sm w-full text-text mb-2"
                        numberOfLines={2}
                    >
                        {burrow.description.replaceAll(/\n/g, " ")}
                    </Text>
                )}

                {/* Kind chip underneath date */}
                <View className="flex-row items-center justify-between mt-2">
                    {/* capacity and waitlist */}
                    <View className="flex-row items-center gap-2">
                        {/* Capacity badge */}
                        {burrow.capacity != null && burrow.capacity !== 0 && (
                            <CapacityBadge
                                joined={joined}
                                capacity={burrow.capacity ?? 0}
                            />
                        )}

                        {/* Waitlist */}
                        {waiting > 0 && (
                            <View
                                className="flex-row items-center gap-1 px-2 py-1 rounded-full border"
                                style={{
                                    borderColor: colors.warn,
                                    backgroundColor: `${colors.warn}1A`
                                }}
                            >
                                <Text
                                    className="text-xs font-semibold"
                                    style={{ color: colors.warn }}
                                >
                                    +{waiting}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row gap-2">
                        {/* Location chip */}
                        {burrow.location && (
                            <LocationChip location={burrow.location} />
                        )}

                        {/* TA badge */}
                        {hostedByTa && <TABadge />}

                        {/* Kind badge */}
                        <KindChip kind={burrow.kind} />
                    </View>
                </View>
            </View>
        </Pressable>
    )
}
