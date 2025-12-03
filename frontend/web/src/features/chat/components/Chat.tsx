import { useMemo, useState } from "react"
import { Pencil, Pin, X } from "lucide-react"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"

function getUserColor(userID: string): string {
    const colors = [
        "text-blue-500",
        "text-green-500",
        "text-purple-500",
        "text-pink-500",
        "text-yellow-500",
        "text-cyan-500",
        "text-orange-500",
        "text-indigo-500"
    ]

    const hash = userID.split("").reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)

    return colors[Math.abs(hash) % colors.length]
}

/**
 * {@link Chat}
 */
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
 * An individual chat message.
 *
 * @param message The message contents.
 * @param canEdit If this message can be edited by the user.
 * @param canDelete If this message can be deleted by the user.
 * @param canPin If this message can be pinned by the user.
 * @param members The members of the chat.
 * @param deleteButton When the delete button is pressed.
 * @param editButton When the edit button is pressed.
 * @param pinButton When the pin button is pressed.
 * @param isConsecutiv If the author of this message posted another before it.
 *
 * @author AJ Kneisl
 */
export default function Chat({
    message,
    canEdit,
    canDelete,
    canPin = false,
    members,
    deleteButton,
    editButton,
    pinButton,
    isConsecutive = false
}: ChatProps) {
    const [isHovered, setIsHovered] = useState(false)

    const userColor = useMemo(
        () => getUserColor(message.senderID),
        [message.senderID]
    )

    const dateStr = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    })

    return (
        <div
            key={`${message.id}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group hover:bg-background/30 relative px-4 transition-colors duration-75 ${
                isConsecutive ? "mt-0.5 py-0.5" : "mt-4 pt-1 pb-1 first:mt-1"
            }`}
        >
            <div className="flex w-full items-start gap-4">
                {/* Avatar column - always present for alignment */}
                <div className="flex min-w-[52px] flex-shrink-0 items-start justify-center pt-0.5">
                    {!isConsecutive ? (
                        <ProfilePicture
                            name={members[message.senderID]?.name}
                            userID={message.senderID}
                            size="ksm"
                        />
                    ) : (
                        isHovered && (
                            <span className="text-text/40 text-[10px] leading-[22px] font-medium whitespace-nowrap">
                                {dateStr}
                            </span>
                        )
                    )}
                </div>

                {/* Message content */}
                <div className="min-w-0 flex-1">
                    {!isConsecutive && (
                        <div className="mb-0.5 flex items-baseline gap-2">
                            <span
                                className={`text-[15px] leading-[22px] font-semibold ${userColor}`}
                            >
                                {members[message.senderID]?.name ||
                                    "Unknown User"}
                            </span>
                            <span className="text-text/40 text-[11px] leading-[22px] font-medium">
                                {new Date(message.createdAt).toLocaleString(
                                    [],
                                    {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit"
                                    }
                                )}
                            </span>
                        </div>
                    )}

                    <div className="text-text text-[15px] leading-[22px] break-words">
                        {message.message}
                    </div>
                </div>

                {/* Action buttons */}
                {(canEdit || canDelete || canPin) && (
                    <div className="bg-hero border-background/60 absolute -top-3 right-4 hidden items-center gap-0.5 rounded border px-0.5 py-0.5 shadow-md group-hover:flex">
                        {canPin && pinButton && (
                            <button
                                onClick={pinButton}
                                aria-label="Pin message"
                                className="text-text/60 hover:text-primary hover:bg-primary/10 rounded p-1 transition-colors"
                                title="Pin"
                            >
                                <Pin className="h-4 w-4" />
                            </button>
                        )}

                        {canEdit && (
                            <button
                                onClick={() => editButton("debug")}
                                aria-label="Edit message"
                                className="text-text/60 hover:text-text hover:bg-background/50 rounded p-1 transition-colors"
                                title="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={deleteButton}
                                aria-label="Delete message"
                                className="text-text/60 hover:text-error hover:bg-error/10 rounded p-1 transition-colors"
                                title="Delete"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
