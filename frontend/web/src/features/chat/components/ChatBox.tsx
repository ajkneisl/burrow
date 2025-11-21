import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Chat from "@features/chat/components/Chat.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types.ts"
import {
    type SyncIncomingEvent,
    SyncOutgoingEvent
} from "@features/sync/sync.types.ts"
import { useAtomValue } from "jotai"
import { syncRetry, syncStatus } from "@features/sync/sync.atom.ts"
import { Button, Card, Input } from "@umnburrow/core"
import { MessageSquare, Pencil, Send, X } from "lucide-react"

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
 * @constructor
 */
export default function ChatBox({ burrow }: ChatBoxProps) {
    const user = useUser()

    const status = useAtomValue(syncStatus)
    const retry = useAtomValue(syncRetry)

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

            switch (payload.type) {
                // receive message history
                case "HISTORY": {
                    const messageHistory = payload.payload
                        .messages as ChatMessage[]

                    setMessages(messageHistory.sort((a, b) => a.date - b.date))
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
                            (message) =>
                                message.messageID !== payload.payload.messageId
                        )
                    )
                    break

                // updated message
                case "MESSAGE_UPDATED":
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.messageID === payload.payload.messageId
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

        // receive history
        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "RECEIVE_HISTORY",
                data: { page: "0" }
            })
        )

        // receive members
        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "RECEIVE_MEMBERS",
                data: {}
            })
        )
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

    // begin an edit
    function startEdit(msg: ChatMessage) {
        setEditingID(msg.messageID)
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

            {/* messages container */}
            <div
                ref={listRef}
                className="scrollbar-thin scrollbar-thumb-background/60 scrollbar-track-transparent flex-1 space-y-2 overflow-y-auto py-4"
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
                    messages.map((message) => (
                        <Chat
                            key={message.messageID}
                            message={message}
                            canEdit={message.userID === user?.id}
                            canDelete={
                                message.userID === user?.id || isModerator
                            }
                            members={members}
                            deleteButton={() =>
                                deleteMessage(message.messageID)
                            }
                            editButton={() => startEdit(message)}
                        />
                    ))
                )}
            </div>

            {/* input area */}
            <div className="border-background/60 border-t pt-4">
                {editingID && (
                    <div className="bg-warn/10 border-warn/20 mb-3 flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-warn/20 rounded p-1">
                                <Pencil className="text-warn h-3 w-3" />
                            </div>
                            <span className="text-text/80 text-xs font-medium">
                                Editing message
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-text/60 hover:text-text hover:bg-background/60 rounded p-1 transition-colors"
                            aria-label="Cancel editing"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <Input
                        className="flex-1"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder={
                            status === "LIVE"
                                ? "Type a message…"
                                : "You are disconnected."
                        }
                        disabled={status !== "LIVE"}
                    />

                    <Button
                        color="INFO"
                        onClick={send}
                        disabled={status !== "LIVE" || !text.trim()}
                        className="px-4"
                    >
                        {editingID ? (
                            "Save"
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
