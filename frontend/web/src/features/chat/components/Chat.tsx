import { useMemo, useState } from "react"
import { Pencil, X } from "lucide-react"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"

/**
 * {@link Chat}
 */
type ChatProps = {
    message: ChatMessage
    members: Record<string, ChatMember>
    canEdit: boolean
    canDelete: boolean
    deleteButton: () => void
    editButton: (content: string) => void
}

/**
 * An individual chat message.
 *
 * @param message The message contents.
 * @param canEdit If this message can be edited by the user.
 * @param canDelete If this message can be deleted by the user.
 * @param members The members of the chat.
 * @param deleteButton When the delete button is pressed.
 * @param editButton When the edit button is pressed.
 *
 * @author AJ Kneisl
 */
export default function Chat({
    message,
    canEdit,
    canDelete,
    members,
    deleteButton,
    editButton
}: ChatProps) {
    const [isHovered, setIsHovered] = useState(false)

    const dateStr = useMemo(
        () =>
            new Date(message.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: isHovered ? "2-digit" : undefined
            }),
        [isHovered, message.date]
    )

    return (
        <div
            key={`${message.messageID}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group"
        >
            <div className="bg-background/60 border-background/80 mt-0.5 inline-flex w-full flex-row items-center gap-4 rounded-xl border px-3 py-2">
                <ProfilePicture
                    name={members[message.userID]?.name}
                    userID={message.userID}
                    size="sm"
                />

                <div className="flex w-full flex-col">
                    <div className="flex w-full flex-row items-center justify-between">
                        <span className="mr-2 font-medium">
                            {members[message.userID]?.name}
                        </span>

                        <div className="text-xs text-gray-500">{dateStr}</div>
                    </div>

                    <div className="flex flex-row items-center justify-between">
                        <span className="text-text/70">{message.message}</span>

                        {(canEdit || canDelete) && (
                            <div className="hidden flex-row gap-2 text-sm group-hover:inline-flex">
                                {canEdit && (
                                    <button
                                        onClick={() => editButton("debug")}
                                        aria-label="Edit"
                                        className="text-warn hover:text-warn-hover cursor-pointer"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        onClick={deleteButton}
                                        aria-label="Delete"
                                        className="text-error hover:text-error-hover cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
