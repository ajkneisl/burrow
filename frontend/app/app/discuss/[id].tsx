import { useEffect, useMemo, useState } from "react"
import { View, Text, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import useChatSync from "@features/chat/hooks/useChatSync"
import GenericChatBox from "@features/chat/components/GenericChatBox"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * View an individual topic and its chat.
 */
export default function TopicScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const colors = useThemeColors()

    const {
        status,
        topics,
        messages,
        users,
        subscribeTopic,
        unsubscribeTopic,
        sendTopicMessage,
        getUsers
    } = useChatSync()

    const [text, setText] = useState("")

    // Get the current topic
    const topic = useMemo(() => {
        return topics.find((topic) => topic.id === id)
    }, [id, topics])

    // Subscribe on mount, unsubscribe on dismount
    useEffect(() => {
        if (!id || status !== "LIVE") return

        subscribeTopic(id)

        return () => {
            unsubscribeTopic(id)
        }
    }, [id, status, subscribeTopic, unsubscribeTopic])

    // Get unknown user information
    useEffect(() => {
        if (status !== "LIVE" || messages.length === 0) return

        // Find the unknown sender IDs
        const unknownSenderIDs = [
            ...new Set(messages.map((m) => m.senderID))
        ].filter((id) => !users[id])

        if (unknownSenderIDs.length > 0) {
            getUsers(unknownSenderIDs)
        }
    }, [status, messages, users, getUsers])

    const handleSend = () => {
        const message = text.trim()
        if (!message || !id || status !== "LIVE") return

        sendTopicMessage(id, message)
        setText("")
    }

    const handleBack = () => {
        router.back()
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border">
                <View className="flex-row items-center gap-4">
                    <Pressable onPress={handleBack} className="p-2 -ml-2">
                        <ArrowLeft size={24} color={colors.text} />
                    </Pressable>

                    <View className="flex-1 min-w-0">
                        <Text
                            className="text-xl font-bold text-text"
                            numberOfLines={1}
                        >
                            {topic?.name || "Loading..."}
                        </Text>

                        {topic?.description && (
                            <Text
                                className="text-sm text-text dark:text-text opacity-60 mt-0.5"
                                numberOfLines={1}
                            >
                                {topic.description}
                            </Text>
                        )}
                    </View>

                    {/* Connection status indicator */}
                    <View className="flex-row items-center gap-2">
                        <View
                            className={`h-2 w-2 rounded-full ${
                                status === "LIVE"
                                    ? "bg-success"
                                    : status === "CONNECTING"
                                      ? "bg-warn"
                                      : "bg-error"
                            }`}
                        />
                        <Text
                            className={`text-xs font-medium ${
                                status === "LIVE"
                                    ? "text-success"
                                    : status === "CONNECTING"
                                      ? "text-warn"
                                      : "text-error"
                            }`}
                        >
                            {status === "LIVE" && "Live"}
                            {status === "CONNECTING" && "Connecting"}
                            {status === "DISCONNECTED" && "Disconnected"}
                            {status === "ERROR" && "Error"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Chat */}
            <GenericChatBox
                status={status}
                messages={messages}
                members={users}
                text={text}
                onTextChange={setText}
                onSend={handleSend}
                canEdit={() => false}
                canDelete={() => false}
                placeholder="Type a message..."
                disconnectedPlaceholder="Connecting..."
            />
        </SafeAreaView>
    )
}
