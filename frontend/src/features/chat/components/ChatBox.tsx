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
        <section className="border border-primary/30 rounded-2xl mt-8 h-[512px] bg-card shadow-sm flex flex-col">
            <header className="border-b border-primary/30 px-4 py-3 flex items-center justify-between">
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
                    <p className="text-sm ">
                        No messages yet. Start the conversation.
                    </p>
                ) : (
                    messages.map((message) => (
                        <Chat
                            message={message}
                            editable={
                                message.userId === user?.googleID || moderator
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
                className={`py-2 ${!editingId && `border-t border-primary/80`}`}
            >
                {editingId && (
                    <div className="relative mb-2 flex flex-col items-center rounded-t-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Editing message</span>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>
                        <div className="absolute left-1/2 top-full -translate-x-1/2 h-0 w-0 border-x-6 border-t-6 border-x-transparent border-t-gray-300" />
                        <div className="absolute left-1/2 top-[calc(100%_-_1px)] -translate-x-1/2 h-0 w-0 border-x-5 border-t-5 border-x-transparent border-t-white" />
                    </div>
                )}

                <div className="flex items-center gap-2 py-2 px-4 ">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder={
                            status === "LIVE"
                                ? "Write a message…"
                                : "You are disconnected."
                        }
                        className="input input-bordered w-full text-sm"
                        disabled={status !== "LIVE"}
                    />

                    <button
                        onClick={send}
                        className={`cursor-pointer text-sm rounded-md px-3 py-1.5 font-medium shadow-sm transition ${editingId ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                        disabled={status !== "LIVE" || !text.trim()}
                    >
                        {editingId ? "Save" : "Send"}
                    </button>
                </div>
            </div>
        </section>
    )
}
