import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Chat from "@features/chat/components/Chat.tsx"
import useUser from "@features/auth/api/hooks/useUser.ts"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import type { ChatMember, ChatMessage } from "@features/chat/api/chat.types.ts"
import {
    type SyncIncomingEvent,
    SyncOutgoingEvent
} from "@features/sync/api/sync.types.ts"
import { useAtom } from "jotai"
import { syncStatus } from "@features/sync/api/sync.atom.ts"
import { Button, Card, Input } from "burrow-core"

/**
 * {@link ChatBox}
 */
type ChatBoxProps = {
    meeting: GroupMeetingResponse
}

/**
 * The chatbox for a meeting.
 *
 * @param meeting The meeting the ChatBox is for.
 * @constructor
 */
export default function ChatBox({ meeting }: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [text, setText] = useState("")
    const [status] = useAtom(syncStatus)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingOriginal, setEditingOriginal] = useState<string>("")
    const [names, setNames] = useState<Record<string, string>>({})

    const listRef = useRef<HTMLDivElement | null>(null)

    const user = useUser()
    const meetingId = meeting.meeting.id

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

                        setNames((prev) => ({
                            ...prev,
                            [member.userId]: member.name
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
                                message.messageId !== payload.payload.messageId
                        )
                    )
                    break

                // updated message
                case "MESSAGE_UPDATED":
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.messageId === payload.payload.messageId
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
        setEditingId(msg.messageId)
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
        <Card className="mt-8 h-[512px] flex flex-col justify-between">
            <header className="flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <span className="text-xs font-semibold">
                    {status === "CONNECTING" && "Connecting…"}
                    {status === "LIVE" && "Live"}
                    {status === "DISCONNECTED" && "Disconnected"}
                    {status === "ERROR" && "Error"}
                </span>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-sm text-text/60 text-center">
                        No messages yet. Start the conversation.
                    </p>
                ) : (
                    messages.map((message) => (
                        <Chat
                            message={message}
                            editable={
                                message.userId === user?.id || moderator
                            }
                            names={names}
                            deleteButton={() =>
                                deleteMessage(message.messageId)
                            }
                            editButton={() => startEdit(message)}
                        />
                    ))
                )}
            </div>

            <div
                className={`py-2 ${!editingId && `border-t border-background/80`}`}
            >
                {editingId && (
                    <div className="relative mb-2 flex flex-col items-center rounded-t-lg border border-background bg-base-100 px-3 py-1.5 text-xs text-base-content/80 shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="font-medium">Editing message</span>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="cursor-pointer inline-flex items-center rounded-md border border-background bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/70 hover:bg-base-300"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="absolute left-1/2 top-full -translate-x-1/2 h-0 w-0 border-x-6 border-t-6 border-x-transparent border-t-base-300" />
                        <div className="absolute left-1/2 top-[calc(100%_-_1px)] -translate-x-1/2 h-0 w-0 border-x-5 border-t-5 border-x-transparent border-t-base-100" />
                    </div>
                )}

                <div className="flex items-center w-full justify-between gap-4">
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder={
                            status === "LIVE"
                                ? "Write a message…"
                                : "You are disconnected."
                        }
                        className="w-full"
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
