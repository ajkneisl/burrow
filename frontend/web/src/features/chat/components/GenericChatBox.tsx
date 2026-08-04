import type { ChatMember, ChatMessage } from "@umnburrow/core/api"
import { useLayoutEffect, useRef, type ReactNode } from "react"
import { MessageSquare } from "lucide-react"
import Chat from "@features/chat/components/Chat.tsx"
import ChatInput from "@features/chat/components/ChatInput.tsx"
/**
 * Props for {@link GenericChatBox}
 */
type GenericChatBoxProps = {
    /** The current connection status */
    status: "LIVE" | "CONNECTING" | "DISCONNECTED" | "ERROR"
    /** Optional retry message to show when disconnected */
    retry?: string
    /** Array of messages to display */
    messages: ChatMessage[]
    /** MapView of user IDs to member information */
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
    /** Optional className for the container */
    className?: string
    /** Optional height override (defaults to h-[512px]) */
    height?: string
}

/**
 * A generalized chat box component that can be used for burrows, topics, and other chat contexts.
 * Handles message display with consecutive message grouping, input, and real-time status.
 *
 * @author AJ Kneisl
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
    disconnectedPlaceholder = "You are disconnected.",
    className = "",
    height = "h-[512px]"
}: GenericChatBoxProps) {
    const listRef = useRef<HTMLDivElement | null>(null)

    // Auto-scroll to bottom when messages change
    useLayoutEffect(() => {
        const el = listRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [messages.length])

    return (
        <div className={`flex ${height} flex-col ${className}`}>
            {/* Optional custom header */}
            {header}

            {/* Optional pinned content */}
            {pinnedContent}

            {/* Messages container */}
            <div
                ref={listRef}
                className="flex-1 scrollbar-thin scrollbar-thumb-background/60 scrollbar-track-transparent overflow-y-auto py-4"
            >
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center">
                        <MessageSquare className="mb-3 size-12 text-text/20" />
                        <p className="text-center text-sm font-medium text-text/60">
                            No messages yet
                        </p>
                        <p className="text-center text-xs text-text/40">
                            Start the conversation
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const prevMessage =
                            index > 0 ? messages[index - 1] : null
                        const isConsecutive =
                            prevMessage &&
                            prevMessage.senderID === message.senderID &&
                            message.createdAt - prevMessage.createdAt < 300000 // 5 minutes

                        return (
                            <Chat
                                key={message.id}
                                message={message}
                                canEdit={canEdit(message)}
                                canDelete={canDelete(message)}
                                canPin={canPin(message)}
                                members={members}
                                deleteButton={() => onDelete?.(message.id)}
                                editButton={() => onEdit?.(message)}
                                pinButton={() => onPin?.(message.id)}
                                isConsecutive={isConsecutive ?? undefined}
                            />
                        )
                    })
                )}
            </div>

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
        </div>
    )
}
