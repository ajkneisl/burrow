import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { Text } from "@components/core"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { ArrowLeft, Users, Plus } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { get } from "@api/api"
import { MyClubResponse } from "@features/clubs/club.types"
import CreateClubModal from "@features/clubs/components/CreateClubModal"
import { createClubModalOpen } from "@features/layout/layout.atom"
import ClubCard from "@features/clubs/components/ClubCard"

/**
 * My Clubs settings screen — shows clubs the user is a member of.
 *
 * @author AJ Kneisl
 */
export default function MyClubsScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const [, setCreateClubOpen] = useAtom(createClubModalOpen)

    const { data: clubs, isLoading } = useQuery<MyClubResponse[]>({
        queryKey: ["clubs", "mine"],
        queryFn: async () => await get("/clubs/mine")
    })

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <CreateClubModal />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 mr-2 -ml-2"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <View className="flex-1">
                    <Text className="text-2xl font-bold text-text">
                        My Clubs
                    </Text>

                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        {clubs?.length ?? 0} club
                        {clubs?.length !== 1 ? "s" : ""}
                    </Text>
                </View>

                <Pressable
                    onPress={() => setCreateClubOpen(true)}
                    className="bg-primary rounded-full px-4 py-2 flex-row items-center gap-1.5"
                >
                    <Plus size={16} color="#FFFFFF" strokeWidth={3} />

                    <Text className="text-white font-semibold text-sm">
                        Create
                    </Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {isLoading ? (
                    <View className="items-center justify-center py-12">
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>
                ) : !clubs || clubs.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <Users
                            size={48}
                            color={colors.text}
                            style={{ opacity: 0.3 }}
                        />
                        <Text className="text-text text-opacity-60 text-center mt-4">
                            You&apos;re not in any clubs yet
                        </Text>
                        <Text className="text-text text-opacity-40 text-center text-sm mt-2">
                            Browse clubs to find one to join
                        </Text>
                    </View>
                ) : (
                    <View className="gap-3">
                        {clubs.map((item) => (
                            <ClubCard
                                key={item.club.id}
                                item={item}
                                onPress={() =>
                                    router.push(
                                        `/club/${item.club.name}` as any
                                    )
                                }
                            />
                        ))}
                    </View>
                )}

                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}
