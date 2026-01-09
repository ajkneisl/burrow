import { View, Text, ScrollView, Pressable, Linking, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { useRouter } from "expo-router"
import useUser from "@features/auth/hooks/useUser"
import useProfile from "@features/auth/hooks/useProfile"
import { Header } from "@features/layout/components"
import { Card, Button } from "@components/core"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import { Settings, Edit, Calendar, Users, Instagram, Linkedin } from "lucide-react-native"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import { EditableProfile } from "@features/profile/components/EditableProfile"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Profile screen
 *
 * @author AJ Kneisl
 */
export default function ProfileScreen() {
    const user = useUser()
    const profile = useProfile()
    const router = useRouter()
    const { signOut } = useGoogleAuth()
    const [isEditing, setIsEditing] = useState(false)
    const colors = useThemeColors()

    if (!user || !profile) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text dark:text-text opacity-60">Loading profile...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header
                title="Profile"
                showSearch={false}
                rightAction={
                    <Pressable
                        onPress={() => router.push("/settings")}
                        className="p-2"
                    >
                        <Settings size={24} color={colors.text} />
                    </Pressable>
                }
            />

            <ScrollView className="flex-1 px-6 py-4">
                {isEditing ? (
                    <EditableProfile
                        profile={profile}
                        onCancel={() => setIsEditing(false)}
                        onSave={() => setIsEditing(false)}
                    />
                ) : (
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
                            <Text className="text-text text-opacity-60 mt-1">
                                @{user.username}
                            </Text>

                            {/* Edit Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => setIsEditing(true)}
                                leftIcon={<Edit size={16} color={colors.primary} />}
                                className="mt-4"
                            >
                                Edit Profile
                            </Button>
                        </View>

                        {/* About Section */}
                        {profile.bio && (
                            <Card variant="bordered" className="mb-4">
                                <Text className="text-lg font-semibold text-text mb-2">
                                    About
                                </Text>

                                <Text className="text-text text-opacity-80">
                                    {profile.bio}
                                </Text>
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

                        {/* My Burrows */}
                        <Card variant="bordered" className="mb-4">
                            <Text className="text-lg font-semibold text-text mb-3">
                                My Burrows
                            </Text>

                            <View className="items-center py-4">
                                <Text className="text-text text-opacity-60">
                                    No Burrows created yet
                                </Text>
                                <Text className="text-text text-opacity-60 text-sm mt-1">
                                    Tap the + button to create one
                                </Text>
                            </View>
                        </Card>

                        {/* Sign Out */}
                        <Button
                            variant="outline"
                            onPress={signOut}
                            className="mb-20"
                        >
                            Sign Out
                        </Button>
                    </>
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
                <Text className="text-xs text-text text-opacity-60 mb-0.5">{label}</Text>
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
