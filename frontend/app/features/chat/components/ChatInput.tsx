import { View, TextInput, Pressable } from "react-native"
import { Pencil, Send, X } from "lucide-react-native"
import { Button, Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Connection status for the chat.
 */
export type ChatInputStatus = "LIVE" | "CONNECTING" | "DISCONNECTED" | "ERROR"

/**
 * Props for the ChatInput component.
 */
type ChatInputProps = {
    /** Current input value */
    value: string
    /** Handler for input changes */
    onChange: (value: string) => void
    /** Handler for sending a message */
    onSend: () => void
    /** Current connection status */
    status: ChatInputStatus
    /** Whether currently editing a message */
    isEditing?: boolean
    /** Handler to cancel editing */
    onCancelEdit?: () => void
    /** Placeholder text when connected */
    placeholder?: string
    /** Placeholder text when disconnected */
    disconnectedPlaceholder?: string
}

/**
 * Reusable chat input component for sending messages (React Native).
 */
export default function ChatInput({
    value,
    onChange,
    onSend,
    status,
    isEditing = false,
    onCancelEdit,
    placeholder = "Type a message...",
    disconnectedPlaceholder = "You are disconnected."
}: ChatInputProps) {
    const colors = useThemeColors()
    const isDisabled = status !== "LIVE"
    const canSend = !isDisabled && value.trim().length > 0

    return (
        <View className="border-t border-card-border bg-card">
            <View className="pt-4 px-4 pb-2">
                {/* edit mode indicator */}
                {isEditing && (
                    <View className="bg-warn/10 border border-warn/20 rounded-lg px-3 py-2 mb-3 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-warn/20 rounded p-1">
                                <Pencil size={12} color={colors.warn} />
                            </View>
                            <Text className="text-text text-opacity-80 text-xs font-medium">
                                Editing message
                            </Text>
                        </View>

                        {onCancelEdit && (
                            <Pressable
                                onPress={onCancelEdit}
                                className="p-1 rounded active:bg-card dark:active:bg-card"
                            >
                                <X size={16} color={colors.text} style={{ opacity: 0.6 }} />
                            </Pressable>
                        )}
                    </View>
                )}

                {/* input and send button */}
                <View className="flex-row gap-2">
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder={
                            isDisabled ? disconnectedPlaceholder : placeholder
                        }
                        placeholderTextColor={`${colors.text}99`}
                        editable={!isDisabled}
                        multiline
                        className="flex-1 border border-card-border rounded-lg px-4 py-3 text-base text-text dark:text-text bg-background dark:bg-background"
                        style={{ maxHeight: 100 }}
                    />

                    <Button
                        variant="primary"
                        onPress={onSend}
                        disabled={!canSend}
                        className="self-end"
                    >
                        {isEditing ? (
                            <Text className="text-white font-semibold">
                                Save
                            </Text>
                        ) : (
                            <Send size={20} color="#FFFFFF" />
                        )}
                    </Button>
                </View>
            </View>
        </View>
    )
}
