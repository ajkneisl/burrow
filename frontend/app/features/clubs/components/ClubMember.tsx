import type { ClubMemberResponse } from "@features/clubs/club.types"
import { useRouter } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import { formatTimeAgo } from "@api/util"
import ClubRoleBadge from "@features/clubs/components/ClubRoleBadge"

type ClubMemberProps = {
    data: ClubMemberResponse
    isSelf: boolean
    isClubOwner: boolean
}

export default function ClubMember({
    data,
    isSelf,
    isClubOwner
}: ClubMemberProps) {
    const router = useRouter()
    const { member, user, profile } = data

    return (
        <Pressable
            onPress={() => router.push(`/user/${user.username}` as any)}
            className="flex-row items-center justify-between active:opacity-70"
        >
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <ProfilePicture
                    name={profile.name}
                    userID={profile.userID}
                    size="sm"
                />

                <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1">
                        <Text
                            className="text-text text-sm font-semibold"
                            numberOfLines={1}
                        >
                            {profile.name}
                        </Text>
                        {isSelf && (
                            <Text className="text-text opacity-50 text-[10px]">
                                (you)
                            </Text>
                        )}
                    </View>
                    <Text className="text-text opacity-50 text-xs">
                        @{user.username}
                    </Text>
                    <Text className="text-text opacity-40 text-[10px]">
                        Joined {formatTimeAgo(member.joinedAt)}
                    </Text>
                </View>
            </View>

            <ClubRoleBadge role={member.role} roleName={member.roleName} />
        </Pressable>
    )
}
