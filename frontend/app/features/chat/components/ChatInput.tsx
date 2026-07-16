import { View, TextInput, Pressable } from "react-native"
import { Check, Pencil, Send, X } from "lucide-react-native"
import { Text, GlassSurface, glassAvailable } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import clsx from "clsx"

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
        <View className="px-4 pt-2 pb-3">
            {/* edit mode indicator */}
            {isEditing && (
                <View className="bg-warn/10 border border-warn/20 rounded-full px-4 py-2 mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Pencil size={12} color={colors.warn} />
                        <Text className="text-text text-opacity-80 text-xs font-medium">
                            Editing message
                        </Text>
                    </View>

                    {onCancelEdit && (
                        <Pressable onPress={onCancelEdit} hitSlop={8}>
                            <X
                                size={16}
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />
                        </Pressable>
                    )}
                </View>
            )}

            {/* floating pill input + circular send button */}
            <View className="flex-row gap-2 items-end">
                {/* the wrapper is exactly the send button's 48px when a
                    single line and flex-centers the input, so the text
                    stays centered no matter the font metrics */}
                <GlassSurface
                    className={clsx(
                        "flex-1 border rounded-3xl min-h-12 justify-center",
                        glassAvailable
                            ? "border-transparent"
                            : "border-card-border"
                    )}
                    fallbackClassName="bg-card"
                >
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder={
                            isDisabled ? disconnectedPlaceholder : placeholder
                        }
                        placeholderTextColor={`${colors.text}99`}
                        editable={!isDisabled}
                        multiline
                        textAlignVertical="center"
                        className="px-5 text-[16px] text-text"
                        style={{
                            paddingTop: 10,
                            paddingBottom: 10,
                            maxHeight: 100
                        }}
                    />
                </GlassSurface>

                <Pressable
                    onPress={onSend}
                    disabled={!canSend}
                    className={clsx(
                        "w-12 h-12 rounded-full items-center justify-center",
                        canSend ? "bg-primary active:opacity-80" : "bg-card"
                    )}
                >
                    {isEditing ? (
                        <Check
                            size={20}
                            color={canSend ? "#FFFFFF" : `${colors.text}66`}
                            strokeWidth={3}
                        />
                    ) : (
                        <Send
                            size={18}
                            color={canSend ? "#FFFFFF" : `${colors.text}66`}
                        />
                    )}
                </Pressable>
            </View>
        </View>
    )
}
