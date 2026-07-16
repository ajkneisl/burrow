import { Tabs } from "expo-router"
import { StyleSheet, View, useColorScheme } from "react-native"
import { Home, Compass, Plus, Users, User } from "lucide-react-native"
import { useSetAtom } from "jotai"
import { SearchModal } from "@features/layout/components"
import { CreateBurrowModal } from "@features/burrows/create/CreateBurrowModal"
import { BurrowMapModal } from "@features/burrows/components/BurrowMapModal"
import CreateClubModal from "@features/clubs/components/CreateClubModal"
import { createModalOpen } from "@features/layout/layout.atom"
import { GlassSurface, glassAvailable } from "@components/core"
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
    const setCreateOpen = useSetAtom(createModalOpen)

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.text,
                    tabBarInactiveTintColor: "#9CA3AF",
                    tabBarStyle: glassAvailable
                        ? {
                              // float over content so the glass has
                              // something to refract
                              position: "absolute",
                              backgroundColor: "transparent",
                              borderTopWidth: 0,
                              elevation: 0,
                              paddingHorizontal: 16,
                              paddingVertical: 2,
                              paddingTop: 10
                          }
                        : {
                              backgroundColor: colors.background,
                              borderTopColor: isDark
                                  ? "#333333"
                                  : colors.cardBorder,
                              borderTopWidth: 1,
                              paddingHorizontal: 16,
                              paddingVertical: 2,
                              paddingTop: 10
                          },
                    tabBarBackground: glassAvailable
                        ? () => <GlassSurface style={StyleSheet.absoluteFill} />
                        : undefined,
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
                    name="explore"
                    options={{
                        title: "Explore",
                        tabBarIcon: ({ color, size }) => (
                            <Compass color={color} size={size} />
                        )
                    }}
                />

                {/* center create button — opens the modal, never navigates */}
                <Tabs.Screen
                    name="create"
                    options={{
                        title: "Create",
                        tabBarLabel: () => null,
                        tabBarIcon: () => (
                            <View
                                className="w-12 h-12 rounded-full bg-primary items-center justify-center"
                                style={{
                                    marginTop: 4,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4
                                }}
                            >
                                <Plus
                                    size={26}
                                    color="#FFFFFF"
                                    strokeWidth={3}
                                />
                            </View>
                        )
                    }}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault()
                            setCreateOpen(true)
                        }
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
            <CreateClubModal />
        </>
    )
}
