import { useState } from "react"
import { View, Text, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { Card, Button } from "@components/core"
import {
    ArrowLeft,
    User,
    Palette,
    Bell,
    Info,
    FileText,
    Shield,
    LogOut,
    ChevronRight,
    AlertCircle,
    Trash2
} from "lucide-react-native"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import useUser from "@features/auth/hooks/useUser"
import PushNotificationToggle from "@features/notifications/components/PushNotificationToggle"
import { useAtom } from "jotai"
import { themeAtom } from "@api/theme/theme.atom"
import { saveTheme } from "@api/theme/theme.api"
import type { Theme, ThemeColors } from "@api/theme/theme.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import { DeleteAccountModal } from "@features/settings/components/DeleteAccountModal"
import * as Application from "expo-application";

/**
 * The settings page.
 *
 * @author AJ Kneisl
 */
export default function SettingsScreen() {
    const router = useRouter()
    const user = useUser()
    const colors = useThemeColors()
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)

    const { signOut } = useGoogleAuth()

    const [theme, setTheme] = useAtom(themeAtom)

    const handleThemeChange = async (newTheme: Theme) => {
        setTheme(newTheme)
        try {
            await saveTheme(newTheme)
        } catch (error) {
            console.error("Failed to save theme:", error)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <Text className="text-2xl font-bold text-text">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {/* Account Section */}
                <Text className="text-sm font-semibold text-text text-opacity-50 mb-3 uppercase">
                    Account
                </Text>

                <Card variant="bordered" className="mb-6">
                    <SettingItem
                        icon={<User size={20} color={colors.primary} />}
                        label="Edit Profile"
                        subtitle={user ? `@${user.username}` : ""}
                        onPress={() => router.push("/settings/edit-profile")}
                        colors={colors}
                    />
                </Card>

                {/* Appearance Section */}
                <Text className="text-sm font-semibold text-text text-opacity-50 mb-3 uppercase">
                    Appearance
                </Text>

                <Card variant="bordered" className="mb-6">
                    <View className="mb-3">
                        <View className="flex-row items-center mb-3">
                            <Palette size={20} color={colors.primary} />
                            <Text className="text-base font-medium text-text ml-3 flex-1">
                                Theme
                            </Text>
                        </View>

                        {/* Theme Options */}
                        <View className="flex-row gap-2">
                            <ThemeButton
                                label="Light"
                                active={theme === "LIGHT"}
                                onPress={() => handleThemeChange("LIGHT")}
                            />

                            <ThemeButton
                                label="Dark"
                                active={theme === "DARK"}
                                onPress={() => handleThemeChange("DARK")}
                            />

                            <ThemeButton
                                label="Auto"
                                active={theme === "AUTO"}
                                onPress={() => handleThemeChange("AUTO")}
                            />
                        </View>
                    </View>
                </Card>

                {/* Notifications Section */}
                <Text className="text-sm font-semibold text-text text-opacity-50 mb-3 uppercase">
                    Notifications
                </Text>

                <PushNotificationToggle />

                <View className="h-3" />

                <Card variant="bordered" className="mb-3">
                    <SettingItem
                        icon={<Bell size={20} color={colors.primary} />}
                        label="Notification Preferences"
                        subtitle="Manage notification types and delivery"
                        onPress={() => {
                            router.push("/settings/notifications")
                        }}
                        colors={colors}
                    />
                    <View className="h-px bg-card-border my-3" />
                    <SettingItem
                        icon={<Bell size={20} color={colors.info} />}
                        label="View Notifications"
                        subtitle="See all your notifications"
                        onPress={() => {
                            router.push("/notifications")
                        }}
                        colors={colors}
                    />
                </Card>

                <View className="h-3" />

                {/* About Section */}
                <Text className="text-sm font-semibold text-text text-opacity-50 mb-3 uppercase">
                    About
                </Text>

                <Card variant="bordered" className="mb-6">
                    <SettingItem
                        icon={<Info size={20} color={colors.primary} />}
                        label="About Burrow"
                        subtitle={"Version " + (Application.nativeApplicationVersion ?? "INDEV")}
                        onPress={() => {
                            router.push("/settings/about")
                        }}
                        colors={colors}
                    />

                    <View className="h-px bg-card-border my-3" />

                    <SettingItem
                        icon={<Shield size={20} color={colors.primary} />}
                        label="Privacy Policy"
                        onPress={() => {
                            router.push("/settings/privacy")
                        }}
                        colors={colors}
                    />

                    <View className="h-px bg-card-border my-3" />

                    <SettingItem
                        icon={<FileText size={20} color={colors.primary} />}
                        label="Terms of Service"
                        onPress={() => {
                            router.push("/settings/tos")
                        }}
                        colors={colors}
                    />

                    <View className="h-px bg-card-border my-3" />

                    <SettingItem
                        icon={<AlertCircle size={20} color={colors.error} />}
                        label="Report a Problem"
                        subtitle="Help us improve Burrow"
                        onPress={() => {
                            router.push("/settings/report")
                        }}
                        colors={colors}
                    />

                    <View className="h-px bg-card-border my-3" />

                    <SettingItem
                        icon={<Trash2 size={20} color={colors.error} />}
                        label="Delete Account"
                        subtitle="Permanently delete your account"
                        onPress={() => setDeleteModalVisible(true)}
                        colors={colors}
                    />
                </Card>

                {/* Sign Out */}
                <Button
                    variant="outline"
                    onPress={signOut}
                    leftIcon={<LogOut size={20} color={colors.error} />}
                    className="mb-20"
                >
                    <Text className="text-error font-semibold">Sign Out</Text>
                </Button>
            </ScrollView>

            <DeleteAccountModal
                visible={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onDeleted={signOut}
            />
        </SafeAreaView>
    )
}

function SettingItem({
    icon,
    label,
    subtitle,
    onPress,
    colors
}: {
    icon: React.ReactNode
    label: string
    subtitle?: string
    onPress: () => void
    colors: ThemeColors
}) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center active:opacity-70"
        >
            {icon}
            <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-text">{label}</Text>
                {subtitle && (
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        {subtitle}
                    </Text>
                )}
            </View>
            <ChevronRight
                size={20}
                color={colors.text}
                style={{ opacity: 0.4 }}
            />
        </Pressable>
    )
}

function ThemeButton({
    label,
    active,
    onPress
}: {
    label: string
    active: boolean
    onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-1 px-4 py-2 rounded-lg border ${
                active
                    ? "bg-primary border-primary"
                    : "bg-card border-card-border"
            }`}
        >
            <Text
                className={`text-center font-semibold ${
                    active ? "text-white" : "text-text"
                }`}
            >
                {label}
            </Text>
        </Pressable>
    )
}
