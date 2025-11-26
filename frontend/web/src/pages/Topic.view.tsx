import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowLeft, MessageSquare } from "lucide-react"
import useChatSync from "@features/chat/hooks/useChatSync.ts"
import Chat from "@features/chat/components/Chat.tsx"
import ChatInput from "@features/chat/components/ChatInput.tsx"

/**
 * View an individual topic and its chat.
 *
 * @author AJ Kneisl
 */
export default function TopicView() {
    const { id } = useParams<{ id: string }>()

    const nav = useNavigate()

    const {
        status,
        topics,
        messages,
        users,
        subscribeTopic,
        unsubscribeTopic,
        sendTopicMessage,
        getUsers
    } = useChatSync()

    const [text, setText] = useState("")

    const listRef = useRef<HTMLDivElement | null>(null)

    // get the current topic
    const topic = useMemo(() => {
        return topics.find((topic) => topic.id === id)
    }, [id, topics])

    // subscribe on mount, unsubscribe on dismount
    useEffect(() => {
        if (!id || status !== "LIVE") return

        subscribeTopic(id)

        return () => {
            unsubscribeTopic(id)
        }
    }, [id, status, subscribeTopic, unsubscribeTopic])

    // get unknown user information
    useEffect(() => {
        if (status !== "LIVE" || messages.length === 0) return

        // find the unknown sender IDs
        const unknownSenderIDs = [
            ...new Set(messages.map((m) => m.senderID))
        ].filter((id) => !users[id])

        if (unknownSenderIDs.length > 0) {
            getUsers(unknownSenderIDs)
        }
    }, [status, messages, users, getUsers])

    // Auto-scroll to bottom on new messages
    useLayoutEffect(() => {
        const el = listRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [messages.length])

    const handleSend = () => {
        const message = text.trim()
        if (!message || !id || status !== "LIVE") return

        sendTopicMessage(id, message)
        setText("")
    }

    const handleBack = () => {
        nav("/discuss")
    }

    return (
        <main className="mx-auto flex h-[calc(100vh-80px)] max-w-4xl flex-col px-4 py-6">
            {/* header */}
            <header className="mb-4 flex items-center gap-4">
                <button
                    onClick={handleBack}
                    className="text-text/60 hover:text-text hover:bg-background cursor-pointer rounded-lg p-2 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                    <h1 className="text-text truncate text-xl font-bold">
                        {topic?.name || "Loading..."}
                    </h1>

                    {topic?.description && (
                        <p className="text-text/60 truncate text-sm">
                            {topic.description}
                        </p>
                    )}
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
                        {status === "LIVE" && "Live"}
                        {status === "CONNECTING" && "Connecting..."}
                        {status === "DISCONNECTED" && "Disconnected"}
                        {status === "ERROR" && "Error"}
                    </span>
                </div>
            </header>

            {/* Messages */}
            <div className="bg-hero border-background flex-1 overflow-hidden rounded-xl border">
                <div
                    ref={listRef}
                    className="scrollbar-thin scrollbar-thumb-background/60 scrollbar-track-transparent h-full space-y-2 overflow-y-auto p-4"
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
                                key={message.id}
                                message={message}
                                canEdit={false}
                                canDelete={false}
                                members={users}
                                deleteButton={() => {}}
                                editButton={() => {}}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* chat input */}
            <ChatInput
                value={text}
                onChange={setText}
                onSend={handleSend}
                status={status}
                className="mt-4"
                placeholder="Type a message..."
                disconnectedPlaceholder="Connecting..."
            />
        </main>
    )
}
