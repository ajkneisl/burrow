import { View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Settings, History } from "lucide-react-native"
import { Card } from "@components/core"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import useUser from "@features/auth/hooks/useUser"
import useProfile from "@features/auth/hooks/useProfile"
import { convertGraduationYear } from "@api/util"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * self profile card for the homescreen
 *
 * @author AJ Kneisl
 */
export function MyProfileCard() {
    const user = useUser()
    const profile = useProfile()
    const router = useRouter()
    const colors = useThemeColors()

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
                {/* profile picture */}
                <Pressable onPress={() => router.push("/settings")}>
                    <ProfilePicture
                        size="md"
                        name={profile?.name || user?.username}
                        userID={user?.id}
                    />
                </Pressable>

                <View className="flex-1 min-w-0">
                    {/* username and year*/}
                    <View className="flex flex-row items-center gap-2">
                        {/* username */}
                        <Text
                            className="text-lg font-semibold text-text"
                            numberOfLines={1}
                        >
                            {profile?.name || user?.username}
                        </Text>

                        {/* grad year badge */}
                        {profile.gradYear && (
                            <View>
                                <View className="bg-primary bg-opacity-10 px-2 py-1 rounded-full">
                                    <Text className="text-xs font-bold text-white">
                                        {convertGraduationYear(2028)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* history */}
                <Pressable
                    onPress={() => router.push("/history")}
                    className="p-2"
                >
                    <History size={24} color={colors.text} />
                </Pressable>

                {/* settings */}
                <Pressable
                    onPress={() => router.push("/settings")}
                    className="p-2"
                >
                    <Settings size={24} color={colors.text} />
                </Pressable>
            </View>
        </Card>
    )
}
