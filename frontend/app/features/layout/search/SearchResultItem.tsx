import { isBurrowResult, isClubResult, isUserResult } from "@umnburrow/core/api"
import type { SearchResult } from "@umnburrow/core/api"
import { View, Pressable } from "react-native"
import { Text } from "@components/core"
import { MapPin, Users } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture"

type SearchResultItemProps = {
    item: SearchResult
    onPress: () => void
}

export function SearchResultItem({ item, onPress }: SearchResultItemProps) {
    const colors = useThemeColors()

    if (isBurrowResult(item)) {
        return (
            <Pressable
                onPress={onPress}
                className="flex-row items-center gap-3 p-4 rounded-2xl active:opacity-70"
                style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: `${colors.text}10`
                }}
            >
                <View
                    className="rounded-full items-center justify-center"
                    style={{
                        width: 48,
                        height: 48,
                        backgroundColor: `${colors.primary}20`
                    }}
                >
                    <MapPin size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                    <Text
                        className="font-semibold"
                        style={{ color: colors.text, fontSize: 16 }}
                        numberOfLines={1}
                    >
                        {item.burrow.title}
                    </Text>
                    <Text
                        style={{
                            color: `${colors.text}80`,
                            fontSize: 14,
                            marginTop: 2
                        }}
                        numberOfLines={1}
                    >
                        {item.burrow.kind} &bull; by @{item.ownerUsername}
                    </Text>
                </View>
            </Pressable>
        )
    }

    if (isUserResult(item)) {
        const displayName = item.profile.name || item.username

        return (
            <Pressable
                onPress={onPress}
                className="flex-row items-center gap-3 p-4 rounded-2xl active:opacity-70"
                style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: `${colors.text}10`
                }}
            >
                <ProfilePicture
                    name={displayName}
                    userID={item.userID}
                    size="md"
                />
                <View className="flex-1">
                    <Text
                        className="font-semibold"
                        style={{ color: colors.text, fontSize: 16 }}
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    <Text
                        style={{
                            color: `${colors.text}80`,
                            fontSize: 14,
                            marginTop: 2
                        }}
                        numberOfLines={1}
                    >
                        @{item.username}
                        {item.profile.major && ` \u2022 ${item.profile.major}`}
                    </Text>
                </View>
            </Pressable>
        )
    }

    if (isClubResult(item)) {
        return (
            <Pressable
                onPress={onPress}
                className="flex-row items-center gap-3 p-4 rounded-2xl active:opacity-70"
                style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: `${colors.text}10`
                }}
            >
                <ClubProfilePicture
                    clubID={item.clubID}
                    displayName={item.displayName}
                    size="md"
                />
                <View className="flex-1">
                    <Text
                        className="font-semibold"
                        style={{ color: colors.text, fontSize: 16 }}
                        numberOfLines={1}
                    >
                        {item.displayName}
                    </Text>
                    <Text
                        style={{
                            color: `${colors.text}80`,
                            fontSize: 14,
                            marginTop: 2
                        }}
                        numberOfLines={1}
                    >
                        @{item.name}
                    </Text>
                </View>
                <Users size={18} color={`${colors.text}60`} />
            </Pressable>
        )
    }

    return null
}