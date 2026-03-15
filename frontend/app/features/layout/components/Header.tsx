import { useMemo } from "react"
import { View, Text, Pressable, Image } from "react-native"
import { useRouter } from "expo-router"
import { Search, Bell } from "lucide-react-native"
import { useAtom } from "jotai"
import { searchModalOpen } from "../layout.atom"
import { useThemeColors } from "@api/theme/useThemeColors"
import { useNotificationsQuery } from "@features/notifications/notifications.queries"

interface HeaderProps {
    title: string
    badge?: number
    showSearch?: boolean
    showNotifications?: boolean
    leftAction?: React.ReactNode
    rightAction?: React.ReactNode
    leftActions?: React.ReactNode
}

export function Header({
    title,
    badge,
    showSearch = true,
    showNotifications = true,
    leftAction,
    rightAction,
    leftActions
}: HeaderProps) {
    const router = useRouter()
    const colors = useThemeColors()
    const [, setSearchOpen] = useAtom(searchModalOpen)

    const { data: notificationsData } = useNotificationsQuery()

    const unreadCount = useMemo(() => {
        if (!notificationsData) return 0

        return notificationsData.pages
            .filter((page) => page?.contents)
            .flatMap((page) => page.contents)
            .filter((n) => !n?.read).length
    }, [notificationsData])

    return (
        <View className="px-6 py-4 bg-background border-b border-card-border">
            <View className="flex-row items-center justify-between">
                {/* Logo/Title */}
                <View className="flex-row items-center gap-3 flex-1">
                    {leftAction ? (
                        <>
                            {leftAction}
                            <Text className="text-2xl font-bold text-text">
                                {title}
                            </Text>
                            {badge !== undefined && badge > 0 && (
                                <View className="bg-primary/20 rounded-full px-2 py-0.5">
                                    <Text className="text-xs font-semibold text-text">
                                        {badge}
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            <Image
                                source={require("@assets/images/burrow.png")}
                                style={{ width: 40, height: 40 }}
                                resizeMode="contain"
                            />
                            <Text className="text-2xl font-bold text-text">
                                {title}
                            </Text>
                        </>
                    )}
                </View>

                {/* Actions */}
                <View className="flex-row items-center gap-3">
                    {leftActions}

                    {showSearch && (
                        <Pressable
                            onPress={() => setSearchOpen(true)}
                            className="p-2 rounded-lg active:bg-card dark:active:bg-card"
                        >
                            <Search size={24} color={colors.text} />
                        </Pressable>
                    )}

                    {showNotifications && (
                        <Pressable
                            onPress={() => router.push("/notifications")}
                            className="p-2 rounded-lg active:bg-card dark:active:bg-card"
                        >
                            <Bell size={24} color={colors.text} />

                            {unreadCount > 0 && (
                                <View className="absolute top-1 right-1 bg-error rounded-full w-2 h-2" />
                            )}
                        </Pressable>
                    )}

                    {rightAction}
                </View>
            </View>
        </View>
    )
}
