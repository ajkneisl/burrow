import { MyClubResponse, roleBadgeConfig } from "@features/clubs/club.types"
import { useMemo, useState } from "react"
import { Image, Pressable, View } from "react-native"
import { Text } from "@components/core"
import { CDN_URL } from "@api/util"

type ClubCardProps = {
    item: MyClubResponse
    onPress: () => void
}

export default function ClubCard({ item, onPress }: ClubCardProps) {
    const [imageError, setImageError] = useState(false)
    const badge = roleBadgeConfig(item.membership.role)
    const BadgeIcon = badge.Icon

    const initials = useMemo(
        () =>
            item.club.displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join(""),
        [item.club.displayName]
    )

    return (
        <Pressable
            onPress={onPress}
            className="bg-card rounded-2xl border border-card-border p-4 flex-row items-center gap-3 active:opacity-80"
        >
            {/* Avatar */}
            <View className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 items-center justify-center">
                {!imageError ? (
                    <Image
                        source={{
                            uri: `${CDN_URL}/avatars/club/${item.club.id}/avatar`
                        }}
                        className="h-12 w-12"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <Text className="text-primary font-bold text-lg">
                        {initials}
                    </Text>
                )}
            </View>

            {/* Info */}
            <View className="flex-1 min-w-0">
                <Text
                    className="text-text font-semibold text-base"
                    numberOfLines={1}
                >
                    {item.club.displayName}
                </Text>

                <Text className="text-text opacity-40 text-xs">
                    /club/{item.club.name}
                </Text>

                {item.club.description ? (
                    <Text
                        className="text-text opacity-60 text-sm mt-1"
                        numberOfLines={1}
                    >
                        {item.club.description}
                    </Text>
                ) : null}
            </View>

            {/* Role Badge */}
            <View
                className={`${badge.bg} rounded-full px-2.5 py-1 flex-row items-center gap-1`}
            >
                <BadgeIcon
                    size={12}
                    color="currentColor"
                    className={badge.text}
                />
                <Text className={`${badge.text} text-xs font-semibold`}>
                    {item.membership.roleName || item.membership.role}
                </Text>
            </View>
        </Pressable>
    )
}
