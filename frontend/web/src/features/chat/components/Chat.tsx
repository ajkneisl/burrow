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
    pinButton
}: ChatProps) {
    const [isHovered, setIsHovered] = useState(false)

    const dateStr = useMemo(
        () =>
            new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: isHovered ? "2-digit" : undefined
            }),
        [isHovered, message.createdAt]
    )

    const userColor = useMemo(
        () => getUserColor(message.senderID),
        [message.senderID]
    )

    return (
        <div
            key={`${message.id}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group hover:bg-background/40 relative rounded-lg px-3 py-2 transition-all duration-150"
        >
            <div className="flex w-full items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                    <ProfilePicture
                        name={members[message.senderID]?.name}
                        userID={message.senderID}
                        size="sm"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2.5">
                        <span className={`text-sm font-bold ${userColor}`}>
                            {members[message.senderID]?.name || "Unknown User"}
                        </span>
                        <span className="text-text/35 text-[11px] font-medium">
                            {dateStr}
                        </span>
                    </div>

                    <div className="bg-background/50 border-background/70 rounded-lg border px-3 py-2.5 shadow-sm">
                        <p className="text-text text-[13px] leading-relaxed break-words">
                            {message.message}
                        </p>
                    </div>
                </div>

                {/* action buttons */}
                {(canEdit || canDelete || canPin) && (
                    <div className="bg-hero border-background/80 absolute top-2 right-3 hidden items-center gap-0.5 rounded-md border px-1 py-0.5 shadow-lg backdrop-blur-sm group-hover:flex">
                        {canPin && pinButton && (
                            <button
                                onClick={pinButton}
                                aria-label="Pin message"
                                className="text-text/50 hover:bg-primary/20 hover:text-primary rounded p-1.5 transition-all"
                                title="Pin"
                            >
                                <Pin className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {canEdit && (
                            <button
                                onClick={() => editButton("debug")}
                                aria-label="Edit message"
                                className="text-text/50 hover:bg-warn/20 hover:text-warn rounded p-1.5 transition-all"
                                title="Edit"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={deleteButton}
                                aria-label="Delete message"
                                className="text-text/50 hover:bg-error/20 hover:text-error rounded p-1.5 transition-all"
                                title="Delete"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
