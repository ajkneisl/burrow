import { View, ScrollView } from "react-native"
import { Timer } from "lucide-react-native"
import { Text } from "@components/core"
import { Pomodoro } from "@features/sync/components/Pomodoro"
import { useBurrowContext } from "@features/burrows/context/burrows.context"
import { useThemeColors } from "@api/theme/useThemeColors"

export default function PomodoroTab() {
    const colors = useThemeColors()
    const { data, blocks, id, isOwner } = useBurrowContext()

    if (!blocks.includes("POMODORO")) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-6">
                <Timer size={40} color={colors.text} style={{ opacity: 0.3 }} />

                <Text className="text-text opacity-50 text-base mt-3">
                    Pomodoro is not enabled
                </Text>

                <Text className="text-text opacity-30 text-sm mt-1 text-center">
                    The host can enable the Pomodoro timer in Features.
                </Text>
            </View>
        )
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="pb-24"
        >
            <View className="px-6 pt-4">
                <Pomodoro
                    burrowId={id}
                    userRole={
                        data.membership?.role ?? (isOwner ? "HOST" : "MEMBER")
                    }
                />
            </View>
        </ScrollView>
    )
}
