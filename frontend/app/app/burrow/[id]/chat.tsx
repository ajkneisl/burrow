import { View } from "react-native"
import { Text } from "@components/core"
import { MessageSquare } from "lucide-react-native"
import { BurrowChat } from "@features/chat/components/BurrowChat"
import { useBurrowContext } from "@features/burrows/context/burrows.context"
import { useThemeColors } from "@api/theme/useThemeColors"

export default function ChatTab() {
    const colors = useThemeColors()
    const { blocks, id, isMember } = useBurrowContext()

    return (
        <View className="flex-1 bg-background">
            {blocks.includes("CHAT") ? (
                <BurrowChat burrowId={id} isMember={isMember} fullScreen />
            ) : (
                <View className="flex-1 items-center justify-center">
                    <MessageSquare
                        size={40}
                        color={colors.text}
                        style={{ opacity: 0.3 }}
                    />

                    <Text className="text-text opacity-50 text-base mt-3">
                        Chat is not enabled
                    </Text>

                    <Text className="text-text opacity-30 text-sm mt-1">
                        The host can enable chat in Features.
                    </Text>
                </View>
            )}
        </View>
    )
}
