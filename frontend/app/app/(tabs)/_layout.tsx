import { Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Home, Search, Compass, Users, User } from "lucide-react-native"
import { SearchModal } from "@features/layout/components"
import { CreateBurrowModal } from "@features/burrows/create/CreateBurrowModal"
import { BurrowMapModal } from "@features/burrows/components/BurrowMapModal"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * The main tab layout.
 *
 * @author AJ Kneisl
 */
export default function TabsLayout() {
    const colors = useThemeColors()
    const colorScheme = useColorScheme()
    const isDark = colorScheme === "dark"

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.text,
                    tabBarInactiveTintColor: "#9CA3AF",
                    tabBarStyle: {
                        backgroundColor: colors.background,
                        borderTopColor: isDark ? "#333333" : colors.cardBorder,
                        borderTopWidth: 1,
                        paddingHorizontal: 16
                    },
                    tabBarItemStyle: {
                        paddingVertical: 4
                    }
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ color, size }) => (
                            <Home color={color} size={size} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="browse"
                    options={{
                        title: "Browse",
                        tabBarIcon: ({ color, size }) => (
                            <Search color={color} size={size} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="clubs"
                    options={{
                        title: "Clubs",
                        tabBarIcon: ({ color, size }) => (
                            <Compass color={color} size={size} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="friends"
                    options={{
                        title: "Friends",
                        tabBarIcon: ({ color, size }) => (
                            <Users color={color} size={size} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color, size }) => (
                            <User color={color} size={size} />
                        )
                    }}
                />
            </Tabs>

            {/* global modals */}
            <SearchModal />
            <CreateBurrowModal />
            <BurrowMapModal />
        </>
    )
}
