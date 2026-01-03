import { View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Card } from "@components/core"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import useUser from "@features/auth/hooks/useUser"
import useProfile from "@features/auth/hooks/useProfile"
import { convertGraduationYear } from "@api/util"

/**
 * Profile card component for the home screen.
 * Matches the web's MyProfile design.
 */
export function MyProfileCard() {
    const user = useUser()
    const profile = useProfile()
    const router = useRouter()

    if (!user || !profile) {
        return (
            <Card variant="bordered" className="mb-4">
                <View className="flex-row items-center gap-4">
                    <View className="h-20 w-20 rounded-full bg-text bg-opacity-10" />
                    <View className="flex-1">
                        <View className="h-5 w-32 bg-text bg-opacity-10 rounded mb-2" />
                        <View className="h-3 w-24 bg-text bg-opacity-10 rounded" />
                    </View>
                </View>
            </Card>
        )
    }

    return (
        <Card variant="bordered" className="mb-4">
            <View className="flex-row items-center gap-4">
                {/* Profile Picture */}
                <Pressable onPress={() => router.push("/settings")}>
                    <ProfilePicture
                        name={profile?.name || user?.username}
                        userID={user?.id}
                    />
                </Pressable>

                {/* Profile Info */}
                <View className="flex-1 min-w-0">
                    <Text
                        className="text-lg font-semibold text-text mb-1"
                        numberOfLines={1}
                    >
                        {profile?.name || user?.username}
                    </Text>

                    {/* Graduation Year Badge */}
                    {profile.gradYear && (
                        <View className="mb-2 self-start">
                            <View className="bg-primary bg-opacity-10 px-2 py-1 rounded-full">
                                <Text className="text-xs font-medium text-primary">
                                    {convertGraduationYear(profile.gradYear)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Links */}
                    <View className="flex-row gap-3">
                        <Pressable onPress={() => router.push(`/user/${user.username}`)}>
                            <Text className="text-xs text-text text-opacity-60 underline">
                                View profile
                            </Text>
                        </Pressable>
                        <Pressable onPress={() => router.push("/friends")}>
                            <Text className="text-xs text-text text-opacity-60 underline">
                                View friends
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Card>
    )
}
