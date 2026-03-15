import { useRef, useEffect, type ReactNode } from "react"
import { View, FlatList } from "react-native"
import { Text } from "@components/core"
import { MessageSquare } from "lucide-react-native"
import Chat from "@features/chat/components/Chat"
import ChatInput from "@features/chat/components/ChatInput"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Props for GenericChatBox
 */
type GenericChatBoxProps = {
    /** The current connection status */
    status: "LIVE" | "CONNECTING" | "DISCONNECTED" | "ERROR"
    /** Optional retry message to show when disconnected */
    retry?: string
    /** Array of messages to display */
    messages: ChatMessage[]
    /** Map of user IDs to member information */
    members: Record<string, ChatMember>
    /** Current input text value */
    text: string
    /** Callback when input text changes */
    onTextChange: (text: string) => void
    /** Callback when send button is clicked */
    onSend: () => void
    /** Optional callback when delete button is clicked */
    onDelete?: (messageId: string) => void
    /** Optional callback when edit button is clicked */
    onEdit?: (message: ChatMessage) => void
    /** Optional callback when pin button is clicked */
    onPin?: (messageId: string) => void
    /** Function to determine if a message can be edited */
    canEdit?: (message: ChatMessage) => boolean
    /** Function to determine if a message can be deleted */
    canDelete?: (message: ChatMessage) => boolean
    /** Function to determine if a message can be pinned */
    canPin?: (message: ChatMessage) => boolean
    /** Optional header content to display above messages */
    header?: ReactNode
    /** Optional content to display between header and messages */
    pinnedContent?: ReactNode
    /** Whether editing is currently active */
    isEditing?: boolean
    /** Callback to cancel editing */
    onCancelEdit?: () => void
    /** Input placeholder text */
    placeholder?: string
    /** Input placeholder when disconnected */
    disconnectedPlaceholder?: string
}

/**
 * A generalized chat box component for React Native.
 * Handles message display with consecutive message grouping, input, and real-time status.
 */
export default function GenericChatBox({
    status,
    messages,
    members,
    text,
    onTextChange,
    onSend,
    onDelete,
    onEdit,
    onPin,
    canEdit = () => false,
    canDelete = () => false,
    canPin = () => false,
    header,
    pinnedContent,
    isEditing = false,
    onCancelEdit,
    placeholder = "Type a message…",
    disconnectedPlaceholder = "You are disconnected."
}: GenericChatBoxProps) {
    const colors = useThemeColors()
    const flatListRef = useRef<FlatList>(null)

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true })
        }
    }, [messages.length])

    const renderMessage = ({
        item,
        index
    }: {
        item: ChatMessage
        index: number
    }) => {
        const prevMessage = index > 0 ? messages[index - 1] : null
        const isConsecutive =
            prevMessage &&
            prevMessage.senderID === item.senderID &&
            item.createdAt - prevMessage.createdAt < 300000 // 5 minutes

        return (
            <Chat
                message={item}
                canEdit={canEdit(item)}
                canDelete={canDelete(item)}
                canPin={canPin(item)}
                members={members}
                deleteButton={() => onDelete?.(item.id)}
                editButton={() => onEdit?.(item)}
                pinButton={() => onPin?.(item.id)}
                isConsecutive={isConsecutive ?? undefined}
            />
        )
    }

    const renderEmpty = () => (
        <View className="flex-1 items-center justify-center py-12">
            <MessageSquare
                size={48}
                color={colors.text}
                style={{ opacity: 0.15 }}
            />
            <Text className="text-text text-opacity-60 text-center text-sm font-medium mt-3">
                No messages yet
            </Text>
            <Text className="text-text text-opacity-40 text-center text-xs mt-1">
                Start the conversation
            </Text>
        </View>
    )

    return (
        <View className="flex-1">
            {/* Optional custom header */}
            {header}

            {/* Optional pinned content */}
            {pinnedContent}

            {/* Messages container */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={
                    messages.length === 0
                        ? { flex: 1 }
                        : { paddingVertical: 16 }
                }
                className="flex-1"
                nestedScrollEnabled={true}
            />

            {/* Input area */}
            <ChatInput
                value={text}
                onChange={onTextChange}
                onSend={onSend}
                status={status}
                isEditing={isEditing}
                onCancelEdit={onCancelEdit}
                placeholder={placeholder}
                disconnectedPlaceholder={disconnectedPlaceholder}
            />
        </View>
    )
}
