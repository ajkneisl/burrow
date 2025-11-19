import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Chat from "@features/chat/components/Chat.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.ts"
import type { ChatMember, ChatMessage } from "@features/chat/chat.types.ts"
import {
    type SyncIncomingEvent,
    SyncOutgoingEvent
} from "@features/sync/sync.types.ts"
import { useAtomValue } from "jotai"
import { syncRetry, syncStatus } from "@features/sync/sync.atom.ts"
import { Button, Card, Input } from "@umnburrow/core"

/**
 * {@link ChatBox}
 */
type ChatBoxProps = {
    meeting: BurrowResponse
}

/**
 * The chatbox for a meeting.
 *
 * @param meeting The meeting the ChatBox is for.
 * @constructor
 */
export default function ChatBox({ meeting }: ChatBoxProps) {
    const status = useAtomValue(syncStatus)
    const retry = useAtomValue(syncRetry)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [text, setText] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingOriginal, setEditingOriginal] = useState<string>("")
    const [members, setMembers] = useState<Record<string, ChatMember>>({})

    const listRef = useRef<HTMLDivElement | null>(null)

    const user = useUser()
    const meetingId = meeting.burrow.id

    const moderator = useMemo(() => {
        return (
            meeting.membership?.role === "MODERATOR" ||
            meeting.membership?.role === "HOST"
        )
    }, [meeting.membership?.role])

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
    }, [meetingId])

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
    }, [status, meetingId])

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
        setEditingId(msg.messageID)
        setEditingOriginal(msg.message)
        setText(msg.message)
    }

    // end edit
    function cancelEdit() {
        setEditingId(null)
        setEditingOriginal("")
        setText("")
    }

    // save an edit and send to socket
    function saveEdit() {
        const contents = text.trim()
        if (status !== "LIVE" || !contents || !editingId) return

        if (editingOriginal === contents) cancelEdit()

        window.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "EDIT_MESSAGE",
                data: { contents, id: editingId }
            })
        )

        setEditingId(null)
        setEditingOriginal("")
        setText("")
    }

    // on the send button
    // redirect to edit, or create on ws
    function send() {
        if (editingId) {
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
        <Card className="mt-8 flex h-[512px] flex-col justify-between">
            <header className="flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <span className="text-xs font-semibold">
                    {status === "CONNECTING" && "Connecting…"}
                    {status === "LIVE" && "Live"}
                    {status === "DISCONNECTED" &&
                        (retry === "" ? "Disconnected" : retry)}
                    {status === "ERROR" && "Error"}
                </span>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <p className="text-text/60 text-center text-sm">
                        No messages yet. Start the conversation.
                    </p>
                ) : (
                    messages.map((message) => (
                        <Chat
                            message={message}
                            canEdit={message.userID === user?.id}
                            canDelete={message.userID === user?.id || moderator}
                            members={members}
                            deleteButton={() =>
                                deleteMessage(message.messageID)
                            }
                            editButton={() => startEdit(message)}
                        />
                    ))
                )}
            </div>

            <div
                className={`py-2 ${!editingId && `border-background/80 border-t`}`}
            >
                {editingId && (
                    <div className="border-background bg-base-100 text-base-content/80 relative mb-2 flex flex-col items-center rounded-t-lg border px-3 py-1.5 text-xs shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="font-medium">Editing message</span>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="border-background bg-base-200 text-base-content/70 hover:bg-base-300 inline-flex cursor-pointer items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="border-t-base-300 absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-6 border-t-6 border-x-transparent" />
                        <div className="border-t-base-100 absolute top-[calc(100%_-_1px)] left-1/2 h-0 w-0 -translate-x-1/2 border-x-5 border-t-5 border-x-transparent" />
                    </div>
                )}

                <div className="flex flex-row justify-between gap-4">
                    <Input
                        className={"w-2/3"}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder={
                            status === "LIVE"
                                ? "Write a message…"
                                : "You are disconnected."
                        }
                        disabled={status !== "LIVE"}
                    />

                    <Button
                        className="col-span-1"
                        color="INFO"
                        onClick={send}
                        disabled={status !== "LIVE" || !text.trim()}
                    >
                        {editingId ? "Save" : "Send"}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
