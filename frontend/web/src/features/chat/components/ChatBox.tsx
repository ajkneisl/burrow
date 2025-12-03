import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Chat from "@features/chat/components/Chat.tsx"
import ChatInput from "@features/chat/components/ChatInput.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types.ts"
import {
    type SyncIncomingEvent,
    SyncOutgoingEvent
} from "@features/sync/sync.types.ts"
import { useAtomValue } from "jotai"
import { syncRetry, syncStatus } from "@features/sync/sync.atom.ts"
import { Card } from "@umnburrow/core"
import { MessageSquare, Pin, X } from "lucide-react"

/**
 * {@link ChatBox}
 */
type ChatBoxProps = {
    burrow: BurrowResponse
}

/**
 * The chatbox for a meeting.
 *
 * @param meeting The meeting the ChatBox is for.
 * @author AJ Kneisl
 */
export default function ChatBox({ burrow }: ChatBoxProps) {
    const user = useUser()

    const status = useAtomValue(syncStatus)
    const retry = useAtomValue(syncRetry)

    const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [text, setText] = useState("")

    // details on editing a message
    const [editingID, setEditingID] = useState<string | null>(null)
    const [editingOriginal, setEditingOriginal] = useState<string>("")
    const [members, setMembers] = useState<Record<string, ChatMember>>({})

    const listRef = useRef<HTMLDivElement | null>(null)
    const burrowID = burrow.burrow.id

    const isModerator =
        burrow.membership?.role === "MODERATOR" ||
        burrow.membership?.role === "HOST"

    useEffect(() => {
        function onState(event: Event) {
            const payload = (event as SyncIncomingEvent).response

            if (payload.burrowID !== burrowID) return

            switch (payload.type) {
                // receive pinned message
                case "PINNED_MESSAGE": {
                    if (payload.payload) {
                        const pinnedMessage = payload.payload as ChatMessage

                        setPinnedMessage(pinnedMessage)
                    } else {
                        setPinnedMessage(null)
                    }

                    break
                }

                // receive message history
                case "HISTORY": {
                    const messageHistory = payload.payload
                        .messages as ChatMessage[]

                    setMessages(
                        messageHistory.sort((a, b) => a.createdAt - b.createdAt)
                    )
                    break
                }

                // receive member names
                case "MEMBERS": {
                    const members: ChatMember[] = payload.payload

                    for (let i = 0; members.length > i; i++) {
                        const member = members[i]

                        setMembers((prev) => ({
                            ...prev,
                            [member.userID]: member
                        }))
                    }

                    break
                }

                // incoming message
                case "NEW_MESSAGE":
                    setMessages((prev) => [
                        ...prev,
                        payload.payload as ChatMessage
                    ])
                    break

                // deleted message
                case "MESSAGE_DELETED":
                    setMessages((prev) =>
                        prev.filter(
                            (message) => message.id !== payload.payload.messageID
                        )
                    )

                    break

                // updated message
                case "MESSAGE_UPDATED":
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.payload.messageId
                                ? {
                                      ...msg,
                                      message: payload.payload.newMessage
                                  }
                                : msg
                        )
                    )
                    break
            }
        }

        window.addEventListener("CHAT_INCOMING", onState as EventListener)

        return () =>
            window.removeEventListener(
                "CHAT_INCOMING",
                onState as EventListener
            )
    }, [burrowID])

    useEffect(() => {
        if (status !== "LIVE") return
    }, [status, burrowID])

    useLayoutEffect(() => {
        const el = listRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [messages.length])

    // delete a message
    function deleteMessage(id: string) {
        if (status !== "LIVE") return

        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "DELETE_MESSAGE",
                data: { id }
            })
        )

        setText("")
    }

    // pin a message
    function pinMessage(messageID: string) {
        if (status !== "LIVE") return

        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "PIN_MESSAGE",
                data: { messageID }
            })
        )
    }

    // unpin the current pinned message
    function unpinMessage() {
        if (status !== "LIVE") return

        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "UN_PIN_MESSAGE",
                data: {}
            })
        )
    }

    // begin an edit
    function startEdit(msg: ChatMessage) {
        setEditingID(msg.id)
        setEditingOriginal(msg.message)
        setText(msg.message)
    }

    // end edit
    function cancelEdit() {
        setEditingID(null)
        setEditingOriginal("")
        setText("")
    }

    // save an edit and send to socket
    function saveEdit() {
        const contents = text.trim()
        if (status !== "LIVE" || !contents || !editingID) return

        if (editingOriginal === contents) cancelEdit()

        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "EDIT_MESSAGE",
                data: { contents, id: editingID }
            })
        )

        setEditingID(null)
        setEditingOriginal("")
        setText("")
    }

    // on the send button
    // redirect to edit, or create on ws
    function send() {
        if (editingID) {
            saveEdit()
            return
        }

        const message = text.trim()
        if (!message || status !== "LIVE") return

        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "CREATE_MESSAGE",
                data: { message }
            })
        )
        setText("")
    }

    return (
        <Card className="flex h-[512px] flex-col">
            {/* header */}
            <header className="border-background/60 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Chat</h3>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${
                            status === "LIVE"
                                ? "bg-success animate-pulse"
                                : status === "CONNECTING"
                                  ? "bg-warn animate-pulse"
                                  : "bg-error"
                        }`}
                    />

                    <span
                        className={`text-xs font-medium ${
                            status === "LIVE"
                                ? "text-success"
                                : status === "CONNECTING"
                                  ? "text-warn"
                                  : "text-error"
                        }`}
                    >
                        {status === "CONNECTING" && "Connecting…"}
                        {status === "LIVE" && "Live"}
                        {status === "DISCONNECTED" &&
                            (retry === "" ? "Disconnected" : retry)}
                        {status === "ERROR" && "Error"}
                    </span>
                </div>
            </header>

            {/* pinned message */}
            {pinnedMessage && (
                <div className="bg-background/60 border-background mt-4 rounded-lg border shadow-sm">
                    <div className="flex items-start gap-3 p-3">
                        <div className="bg-warn/15 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                            <Pin className="text-warn h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-2">
                                <Pin className="text-warn h-3 w-3" />
                                <span className="text-warn text-xs font-semibold uppercase tracking-wide">
                                    Pinned Message
                                </span>
                                <span className="text-text/40 text-xs">
                                    by{" "}
                                    {members[pinnedMessage.senderID]?.name ||
                                        "Unknown"}
                                </span>
                            </div>

                            <p className="text-text line-clamp-2 text-sm leading-relaxed break-words">
                                {pinnedMessage.message}
                            </p>
                        </div>

                        {isModerator && (
                            <button
                                onClick={unpinMessage}
                                className="text-text/40 hover:bg-error/10 hover:text-error mt-1 shrink-0 rounded-md p-1.5 transition-all"
                                title="Unpin message"
                                aria-label="Unpin message"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* messages container */}
            <div
                ref={listRef}
                className="scrollbar-thin scrollbar-thumb-background/60 scrollbar-track-transparent flex-1 overflow-y-auto py-4"
            >
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center">
                        <MessageSquare className="text-text/20 mb-3 h-12 w-12" />

                        <p className="text-text/60 text-center text-sm font-medium">
                            No messages yet
                        </p>

                        <p className="text-text/40 text-center text-xs">
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
                                canEdit={message.senderID === user?.id}
                                canDelete={
                                    message.senderID === user?.id || isModerator
                                }
                                canPin={isModerator}
                                members={members}
                                deleteButton={() => deleteMessage(message.id)}
                                editButton={() => startEdit(message)}
                                pinButton={() => pinMessage(message.id)}
                                isConsecutive={isConsecutive ?? undefined}
                            />
                        )
                    })
                )}
            </div>

            {/* input area */}
            <ChatInput
                value={text}
                onChange={setText}
                onSend={send}
                status={status}
                isEditing={!!editingID}
                onCancelEdit={cancelEdit}
                placeholder="Type a message…"
                disconnectedPlaceholder="You are disconnected."
            />
        </Card>
    )
}
