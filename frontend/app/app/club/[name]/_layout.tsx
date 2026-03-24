import { View, Pressable, ActivityIndicator } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter, Tabs } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { createContext, useContext } from "react"
import { ChevronLeft, Users, Info, Calendar } from "lucide-react-native"
import { get } from "@api/api"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Button, Text } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import type { ClubResponse } from "@features/clubs/club.types"
import ClubBannerPicture from "@features/clubs/components/ClubBannerPicture"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture"
import ClubModeration from "@features/clubs/view/ClubModeration"
import { useColorScheme } from "react-native"

type ClubContextType = {
    data: ClubResponse
    name: string
    colors: ReturnType<typeof useThemeColors>
}

const ClubContext = createContext<ClubContextType | null>(null)

export function useClubContext() {
    const ctx = useContext(ClubContext)
    if (!ctx) throw new Error("useClubContext must be used within ClubLayout")
    return ctx
}

/**
 * Club detail layout with tab navigation.
 *
 * @author AJ Kneisl
 */
export default function ClubLayout() {
    const { name } = useLocalSearchParams<{ name: string }>()
    const router = useRouter()
    const colors = useThemeColors()
    const colorScheme = useColorScheme()
    const isDark = colorScheme === "dark"

    const insets = useSafeAreaInsets()

    const { data, isLoading, isError } = useQuery<ClubResponse>({
        queryKey: ["club", name],
        enabled: !!name,
        queryFn: async () => await get(`/clubs/${name}`)
    })

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        )
    }

    if (isError || !data || !name) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <ThemedIcon icon={ChevronLeft} size={28} />
                    </Pressable>
                </View>

                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-text opacity-60 text-lg mb-4">
                        Failed to load club
                    </Text>
                    <Button variant="primary" onPress={() => router.back()}>
                        Go Back
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    const { club } = data

    return (
        <ClubContext.Provider value={{ data, name, colors }}>
            <View className="flex-1 bg-background">
                {/* Header + Banner + Profile */}
                <View className="bg-card border-b border-card-border">
                    <View
                        className="px-6 pb-4 flex-row items-center gap-3"
                        style={{ paddingTop: insets.top + 16 }}
                    >
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <ThemedIcon icon={ChevronLeft} size={28} />
                        </Pressable>
                        <Text
                            className="text-text font-semibold text-lg flex-1"
                            numberOfLines={1}
                        >
                            {club.displayName}
                        </Text>

                        <ClubModeration clubResponse={data} />
                    </View>

                    <ClubBannerPicture clubID={club.id} />

                    <View className="px-6 pb-5">
                        <View className="-mt-10 mb-3">
                            <ClubProfilePicture
                                clubID={club.id}
                                displayName={club.displayName}
                                size="xl"
                            />
                        </View>

                        <Text className="text-text opacity-50 text-xs font-medium uppercase tracking-wider">
                            {club.category}
                        </Text>

                        <Text className="text-text text-2xl font-bold tracking-tight mt-1">
                            {club.displayName}
                        </Text>

                        <Text className="text-text opacity-40 text-sm font-medium">
                            /club/{club.name}
                        </Text>

                        <View className="flex-row items-center gap-1.5 mt-1">
                            <Users
                                size={14}
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />

                            <Text className="text-text opacity-60 text-sm">
                                {data.memberCount} member
                                {data.memberCount !== 1 ? "s" : ""}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tab navigator */}
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: colors.text,
                        tabBarInactiveTintColor: "#9CA3AF",
                        tabBarStyle: {
                            backgroundColor: colors.background,
                            borderTopColor: isDark ? "#333333" : colors.cardBorder,
                            borderTopWidth: 1,
                            paddingHorizontal: 16,
                            paddingVertical: 2,
                            paddingTop: 10
                        },
                        tabBarItemStyle: {
                            paddingVertical: 4
                        }
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: "Info",
                            tabBarIcon: ({ color, size }) => (
                                <Info color={color} size={size} />
                            )
                        }}
                    />

                    <Tabs.Screen
                        name="burrows"
                        options={{
                            title: "Burrows",
                            tabBarIcon: ({ color, size }) => (
                                <Calendar color={color} size={size} />
                            )
                        }}
                    />

                    <Tabs.Screen
                        name="members"
                        options={{
                            title: "Members",
                            tabBarIcon: ({ color, size }) => (
                                <Users color={color} size={size} />
                            )
                        }}
                    />
                </Tabs>
            </View>
        </ClubContext.Provider>
    )
}
