import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowLeft } from "lucide-react"
import useChatSync from "@features/chat/hooks/useChatSync.ts"
import GenericChatBox from "@features/chat/components/GenericChatBox.tsx"
import { Card } from "@umnburrow/core"

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
        <main className="mx-auto max-w-4xl px-4 py-6">
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

            {/* Chat */}
            <Card>
                <GenericChatBox
                    status={status}
                    messages={messages}
                    members={users}
                    text={text}
                    onTextChange={setText}
                    onSend={handleSend}
                    canEdit={() => false}
                    canDelete={() => false}
                    placeholder="Type a message..."
                    disconnectedPlaceholder="Connecting..."
                    height="h-[calc(100vh-240px)]"
                />
            </Card>
        </main>
    )
}
