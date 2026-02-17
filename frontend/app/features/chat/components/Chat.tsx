import { useState } from "react"
import { View, Text, Pressable } from "react-native"
import { Pencil, Pin, X } from "lucide-react-native"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"

type ChatProps = {
    message: ChatMessage
    members: Record<string, ChatMember>
    canEdit: boolean
    canDelete: boolean
    canPin?: boolean
    deleteButton: () => void
    editButton: (content: string) => void
    pinButton?: () => void
    isConsecutive?: boolean
}

/**
 * An individual chat message component for React Native.
 */
export default function Chat({
    message,
    members,
    canEdit,
    canDelete,
    canPin = false,
    deleteButton,
    editButton,
    pinButton,
    isConsecutive = false
}: ChatProps) {
    const colors = useThemeColors()
    const [isPressed, setIsPressed] = useState(false)

    const dateStr = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    })

    return (
        <Pressable
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            className={`px-4 ${isConsecutive ? "py-0.5" : "py-2 mt-2 first:mt-0"} ${
                isPressed ? "bg-card dark:bg-card" : ""
            }`}
        >
            <View className="flex-row items-start gap-3">
                {/* Avatar column */}
                <View className="w-10 items-center justify-start pt-0.5">
                    {!isConsecutive ? (
                        <ProfilePicture
                            name={members[message.senderID]?.name || "Unknown"}
                            userID={message.senderID}
                            size="sm"
                        />
                    ) : (
                        isPressed && (
                            <Text className="text-text dark:text-text opacity-50 text-xs">
                                {dateStr}
                            </Text>
                        )
                    )}
                </View>

                {/* Message content */}
                <View className="flex-1 min-w-0">
                    {!isConsecutive && (
                        <View className="flex-row items-baseline gap-2 mb-1">
                            <Text
                                className="font-semibold text-base"
                                style={{ color: colors.primary }}
                            >
                                {members[message.senderID]?.name ||
                                    "Unknown User"}
                            </Text>
                            <Text className="text-text dark:text-text opacity-50 text-xs">
                                {new Date(message.createdAt).toLocaleString(
                                    [],
                                    {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit"
                                    }
                                )}
                            </Text>
                        </View>
                    )}

                    <Text className="text-text text-base leading-6">
                        {message.message}
                    </Text>
                </View>

                {/* Action buttons - only show on long press for mobile */}
                {(canEdit || canDelete || canPin) && isPressed && (
                    <View className="flex-row gap-1">
                        {canPin && pinButton && (
                            <Pressable
                                onPress={pinButton}
                                className="p-2 rounded active:bg-card dark:active:bg-card"
                            >
                                <Pin size={16} color={colors.text} style={{ opacity: 0.6 }} />
                            </Pressable>
                        )}

                        {canEdit && (
                            <Pressable
                                onPress={() => editButton("debug")}
                                className="p-2 rounded active:bg-card dark:active:bg-card"
                            >
                                <Pencil size={16} color={colors.text} style={{ opacity: 0.6 }} />
                            </Pressable>
                        )}

                        {canDelete && (
                            <Pressable
                                onPress={deleteButton}
                                className="p-2 rounded active:bg-red-100"
                            >
                                <X size={16} color={colors.error} />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    )
}
