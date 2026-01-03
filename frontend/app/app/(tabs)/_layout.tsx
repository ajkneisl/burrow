import { Tabs } from "expo-router"
import { Home, Search, MapPin, Users, User } from "lucide-react-native"
import { SearchModal } from "@features/layout/components"
import { CreateBurrowModal } from "@features/burrows/create/CreateBurrowModal"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * The main tab layout.
 *
 * @author AJ Kneisl
 */
export default function TabsLayout() {
    const colors = useThemeColors()

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.text,
                    tabBarInactiveTintColor: "#9CA3AF",
                    tabBarStyle: {
                        backgroundColor: colors.background,
                        borderTopColor: colors.cardBorder,
                        borderTopWidth: 1,
                        height: 80,
                        paddingBottom: 16,
                        paddingTop: 16
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
                    name="map"
                    options={{
                        title: "Map",
                        tabBarIcon: ({ color, size }) => (
                            <MapPin color={color} size={size} />
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
        </>
    )
}
