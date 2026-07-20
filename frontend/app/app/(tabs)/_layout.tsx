import { Tabs } from "expo-router"
import { View } from "react-native"
import { Home, Compass, Plus, Users, User } from "lucide-react-native"
import { useSetAtom } from "jotai"
import { SearchModal, useGlassTabOptions } from "@features/layout/components"
import { CreateBurrowModal } from "@features/burrows/create/CreateBurrowModal"
import { BurrowMapModal } from "@features/burrows/components/BurrowMapModal"
import CreateClubModal from "@features/clubs/components/CreateClubModal"
import { createModalOpen } from "@features/layout/layout.atom"

/**
 * The main tab layout.
 *
 * @author AJ Kneisl
 */
export default function TabsLayout() {
    const setCreateOpen = useSetAtom(createModalOpen)
    const tabOptions = useGlassTabOptions()

    return (
        <>
            <Tabs screenOptions={tabOptions}>
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
