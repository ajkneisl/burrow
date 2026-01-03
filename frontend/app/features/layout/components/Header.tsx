import { View, Text, Pressable, Image } from "react-native"
import { useRouter } from "expo-router"
import { Search, Bell } from "lucide-react-native"
import { useAtom } from "jotai"
import { searchModalOpen } from "../layout.atom"
import { useThemeColors } from "@api/theme/useThemeColors"

interface HeaderProps {
    title: string
    showSearch?: boolean
    showNotifications?: boolean
    leftAction?: React.ReactNode
    rightAction?: React.ReactNode
}

export function Header({
    title,
    showSearch = true,
    showNotifications = true,
    leftAction,
    rightAction
}: HeaderProps) {
    const router = useRouter()
    const colors = useThemeColors()
    const [, setSearchOpen] = useAtom(searchModalOpen)

    return (
        <View className="px-6 py-4 bg-background border-b border-card-border">
            <View className="flex-row items-center justify-between">
                {/* Logo/Title */}
                <View className="flex-row items-center gap-3 flex-1">
                    {leftAction ? (
                        <>
                            {leftAction}
                            <Text className="text-2xl font-bold text-text flex-1">
                                {title}
                            </Text>
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
                            onPress={() => {
                                // TODO: Navigate to notifications
                            }}
                            className="p-2 rounded-lg active:bg-card dark:active:bg-card"
                        >
                            <Bell size={24} color={colors.text} />
                            {/* Notification badge */}
                            <View className="absolute top-1 right-1 bg-error rounded-full w-2 h-2" />
                        </Pressable>
                    )}

                    {rightAction}
                </View>
            </View>
        </View>
    )
}
