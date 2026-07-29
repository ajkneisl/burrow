import { Pencil, Send, X } from "lucide-react"
import { Button, Input } from "@umnburrow/core"

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
    /** Optional class name for the outer container */
    className?: string
}

/**
 * Reusable chat input component for sending messages.
 *
 * @author AJ Kneisl
 */
export default function ChatInput({
    value,
    onChange,
    onSend,
    status,
    isEditing = false,
    onCancelEdit,
    placeholder = "Type a message...",
    disconnectedPlaceholder = "You are disconnected.",
    className = "border-background/60 border-t pt-4"
}: ChatInputProps) {
    const isDisabled = status !== "LIVE"
    const canSend = !isDisabled && value.trim().length > 0

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && canSend) {
            onSend()
        }
    }

    return (
        <div className={className}>
            {/* edit mode indicator */}
            {isEditing && (
                <div className="mb-3 flex items-center justify-between rounded-lg border border-warn/20 bg-warn/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <div className="rounded bg-warn/20 p-1">
                            <Pencil className="size-3 text-warn" />
                        </div>
                        <span className="text-xs font-medium text-text/80">
                            Editing message
                        </span>
                    </div>

                    {onCancelEdit && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="rounded p-1 text-text/60 transition-colors hover:bg-background/60 hover:text-text"
                            aria-label="Cancel editing"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            )}

            {/* input and send button */}
            <div className="flex gap-2">
                <Input
                    className="flex-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isDisabled ? disconnectedPlaceholder : placeholder
                    }
                    disabled={isDisabled}
                />

                <Button
                    color="INFO"
                    onClick={onSend}
                    disabled={!canSend}
                    className="px-4"
                >
                    {isEditing ? "Save" : <Send className="size-4" />}
                </Button>
            </div>
        </div>
    )
}
