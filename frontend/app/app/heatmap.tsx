import { View, Text, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Stack } from "expo-router"
import { BurrowHeatmap } from "@features/burrows/components/BurrowHeatmap"
import { Header } from "@features/layout/components"
import { Card } from "@components/core"
import { TrendingUp } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Heatmap visualization screen.
 * Shows burrow activity over time in a calendar heatmap format.
 */
export default function HeatmapScreen() {
    const colors = useThemeColors()

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            <Header title="Activity Heatmap" showSearch={false} />

            <ScrollView className="flex-1 px-6 py-4">
                {/* Info Card */}
                <Card variant="bordered" className="bg-info bg-opacity-5 mb-6">
                    <View className="flex-row items-start gap-3">
                        <TrendingUp size={20} color={colors.info} />
                        <View className="flex-1">
                            <Text className="text-text font-semibold mb-1">
                                Your Burrow Activity
                            </Text>
                            <Text className="text-text text-opacity-60 text-sm">
                                See when you've been most active in burrows. Each
                                cell represents a day, with darker colors showing
                                more activity.
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Heatmap - showing 3 months */}
                <BurrowHeatmap range={3} />

                {/* Tips */}
                <Card variant="bordered" className="mt-6 mb-6">
                    <Text className="text-text font-semibold mb-3">
                        How to Use
                    </Text>
                    <View className="space-y-2 gap-2">
                        <TipItem>
                            <Text className="font-semibold">Swipe horizontally</Text>{" "}
                            to view different months
                        </TipItem>
                        <TipItem>
                            <Text className="font-semibold">Tap a cell</Text> to see
                            the exact date
                        </TipItem>
                        <TipItem>
                            <Text className="font-semibold">Darker colors</Text>{" "}
                            mean more burrows on that day
                        </TipItem>
                    </View>
                </Card>

                {/* Bottom Spacer */}
                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}

function TipItem({ children }: { children: React.ReactNode }) {
    return (
        <View className="flex-row">
            <Text className="text-text text-opacity-60 mr-2">•</Text>
            <Text className="text-text text-opacity-80 text-sm flex-1">
                {children}
            </Text>
        </View>
    )
}
