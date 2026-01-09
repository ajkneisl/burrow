import { View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Clock, Check, MapPin, Star, Bookmark } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import useUser from "@features/auth/hooks/useUser"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import { CapacityBadge } from "@components/burrow/CapacityBadge"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import { BURROW_KIND_CONFIG } from "@features/burrows/burrows.types"
import { formatDateTime } from "@api/util"

/**
 * {@link UpcomingBurrowCard}
 */
type UpcomingBurrowCardProps = {
    burrowResponse: BurrowResponse
    verbose?: boolean
}

/**
 * A card for an upcoming Burrow.
 *
 * @param burrowResponse The Burrow response.
 * @param verbose If true, shows the description.
 *
 * @author AJ Kneisl
 */
export function UpcomingBurrowCard({
    burrowResponse,
    verbose = false
}: UpcomingBurrowCardProps) {
    const router = useRouter()
    const colors = useThemeColors()
    const user = useUser()
    const { burrow, membership, bookmarked, burrowAuthorProfile } =
        burrowResponse

    const kindConfig =
        BURROW_KIND_CONFIG[burrow.kind] || BURROW_KIND_CONFIG.STUDY
    const KindIcon = kindConfig.Icon
    const kindColor = colors[kindConfig.colorKey]

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
                        <View className="flex-row gap-1">
                            <Text
                                className="text-base font-bold"
                                style={{
                                    color: isHost
                                        ? colors.secondary
                                        : isJoined
                                          ? colors.success
                                          : colors.text
                                }}
                                numberOfLines={1}
                            >
                                {burrow.title}
                            </Text>

                            {isJoined && !isHost && (
                                <View className="flex-row items-center gap-1">
                                    <Check size={18} color={colors.success} />
                                </View>
                            )}

                            {isHost && (
                                <View className="flex-row items-center gap-1">
                                    <Star
                                        size={18}
                                        color={colors.warn}
                                        fill={colors.warn}
                                    />
                                </View>
                            )}
                        </View>

                        {/*time*/}
                        {burrow.beginningTime && burrow.endTime && (
                            <View
                                className={`flex-row items-center gap-2 ${verbose && `mb-1`}`}
                            >
                                <Clock
                                    size={14}
                                    color={colors.text}
                                    style={{ opacity: 0.8 }}
                                />

                                <Text
                                    className="text-sm text-text"
                                    style={{ opacity: 0.8 }}
                                >
                                    {formatDateTime(
                                        burrow.beginningTime,
                                        burrow.endTime
                                    )}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center gap-2">
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

                        {/* author profile picture */}
                        {burrowAuthorProfile && (
                            <ProfilePicture
                                name={burrowAuthorProfile.name}
                                userID={burrowAuthorProfile.userID}
                                size="sm"
                            />
                        )}
                    </View>
                </View>

                {verbose && burrow.tags && burrow.tags.length > 0 && (
                    <View className="flex flex-row mb-2">
                            <View className="flex-row flex-wrap gap-1 mr-1">
                                {burrow.tags.slice(0, 2).map((tag) => (
                                    <View
                                        key={tag}
                                        className="bg-background border-card-border border px-2 py-1 rounded-full"
                                    >
                                        <Text className="text-xs text-text text-opacity-70">
                                            {tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                    </View>
                )}

                {/* description */}
                {verbose && burrow.description && (
                    <Text
                        className="text-sm w-full text-text mb-2"
                        numberOfLines={2}
                    >
                        {burrow.description.replaceAll(/\n/g, " ")}
                    </Text>
                )}

                {/* Kind chip underneath date */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        {/* Kind badge */}
                        <View
                            className="px-2 py-1 rounded-full flex-row items-center gap-1"
                            style={{ backgroundColor: `${kindColor}33` }}
                        >
                            <KindIcon
                                size={13}
                                color={kindColor}
                                strokeWidth={2.5}
                            />

                            <Text
                                className="text-xs font-bold"
                                style={{ color: kindColor }}
                            >
                                {kindConfig.label}
                            </Text>
                        </View>
                    </View>

                    {/* Location, Capacity and Waitlist */}
                    <View className="flex-row items-center gap-2">
                        {/* Location chip */}
                        {burrow.location && (
                            <View
                                className="flex-row items-center gap-1 px-2 py-1 rounded-full border"
                                style={{
                                    backgroundColor: `${colors.secondary}1A`,
                                    borderColor: colors.secondary
                                }}
                            >
                                <MapPin
                                    size={12}
                                    color={colors.secondary}
                                    style={{ opacity: 0.8 }}
                                />

                                <Text
                                    className="text-xs max-w-[8rem]"
                                    style={{ color: colors.secondary }}
                                    numberOfLines={1}
                                >
                                    {burrow.location}
                                </Text>
                            </View>
                        )}

                        {/* Capacity badge */}
                        <CapacityBadge
                            joined={burrow.joined ?? 0}
                            capacity={burrow.capacity ?? 0}
                        />

                        {/* Waitlist */}
                        {burrow.waiting > 0 && (
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
                                    +{burrow.waiting}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    )
}
