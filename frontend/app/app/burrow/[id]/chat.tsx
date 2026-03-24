import { KeyboardAvoidingView, Platform, View } from "react-native"
import { Text } from "@components/core"
import { MessageSquare, WifiOff, Loader } from "lucide-react-native"
import { BurrowChat } from "@features/chat/components/BurrowChat"
import { useBurrowContext } from "@features/burrows/context/burrows.context"
import { useThemeColors } from "@api/theme/useThemeColors"
import { useAtomValue } from "jotai"
import { syncStatus, syncRetry } from "@features/sync/sync.atom"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"

export default function ChatTab() {
    const colors = useThemeColors()
    const { blocks, id, isMember } = useBurrowContext()
    const status = useAtomValue(syncStatus)
    const retry = useAtomValue(syncRetry)
    const tabBarHeight = useBottomTabBarHeight()

    if (!blocks.includes("CHAT")) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-6">
                <MessageSquare
                    size={40}
                    color={colors.text}
                    style={{ opacity: 0.3 }}
                />

                <Text className="text-text opacity-50 text-base mt-3">
                    Chat is not enabled
                </Text>

                <Text className="text-text opacity-30 text-sm mt-1 text-center">
                    The host can enable chat in Features.
                </Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={tabBarHeight}
        >
            {/* Connection status banner */}
            {status !== "LIVE" && (
                <View
                    className="px-4 py-2.5 flex-row items-center justify-center gap-2"
                    style={{
                        backgroundColor:
                            status === "ERROR"
                                ? `${colors.error}20`
                                : `${colors.warn}20`
                    }}
                >
                    {status === "CONNECTING" ? (
                        <Loader size={14} color={colors.warn} />
                    ) : (
                        <WifiOff size={14} color={status === "ERROR" ? colors.error : colors.warn} />
                    )}

                    <Text
                        className="text-xs font-medium"
                        style={{
                            color: status === "ERROR" ? colors.error : colors.warn
                        }}
                    >
                        {status === "CONNECTING"
                            ? "Connecting to chat..."
                            : status === "ERROR"
                              ? "Connection error"
                              : retry || "Disconnected"}
                    </Text>
                </View>
            )}

            <BurrowChat burrowId={id} isMember={isMember} fullScreen />
        </KeyboardAvoidingView>
    )
}
