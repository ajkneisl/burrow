import { useMemo, useState } from "react"
import type { ChatMessage } from "@features/chat/api/chat.types.ts"

/**
 * {@link Chat}
 */
type ChatProps = {
    message: ChatMessage
    names: Record<string, string>
    editable: boolean
    deleteButton: () => void
    editButton: (content: string) => void
}

/**
 * An individual chat message.
 *
 * @param message The message contents.
 * @param editable If this message can be edited by the user.
 * @param names The names, to find the author of this message.
 * @param deleteButton When the delete button is pressed.
 * @param editButton When the edit button is pressed.
 * @constructor
 */
export default function Chat({
    message,
    editable,
    names,
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
            key={`${message.messageId}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group max-w-prose"
        >
            <div className="inline-flex flex-col mt-0.5 rounded-xl bg-background/60 border border-background/80 px-3 py-2 w-full">
                <div className="flex flex-row items-center justify-between">
                    <span className="font-medium mr-2">
                        {names[message.userId]}
                    </span>

                    <div className="text-xs text-gray-500 inline-flex flex-row">
                        {dateStr}
                    </div>
                </div>

                <div className="flex flex-row justify-between items-center">
                    <span>{message.message}</span>

                    {editable && (
                        <div className="group-hover:inline-flex hidden flex-row gap-2 text-sm">
                            <button
                                onClick={() => editButton("debug")}
                                aria-label="Edit"
                                className="cursor-pointer text-blue-500 hover:text-blue-700"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H3v-4.5L16.732 3.732z"
                                    />
                                </svg>
                            </button>

                            <button
                                onClick={deleteButton}
                                aria-label="Delete"
                                className="cursor-pointer text-red-500 hover:text-red-700"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
