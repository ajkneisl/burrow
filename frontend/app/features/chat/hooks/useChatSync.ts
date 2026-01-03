import { useCallback, useEffect, useRef, useState } from "react"
import { BASE_URL } from "@api/util"
import useToken from "@features/auth/hooks/useToken"
import type {
    ChatSyncStatus,
    ChatSyncResponse,
    Topic,
    ChatMember,
    ChatMessage
} from "@features/chat/chat.types"

const WS_BASE = BASE_URL.replace("http", "ws")

/**
 * Hook for syncing with the chat WebSocket.
 * Handles topics and direct messages.
 */
export default function useChatSync() {
    const auth = useToken()
    const socketRef = useRef<WebSocket | null>(null)

    const [status, setStatus] = useState<ChatSyncStatus>("DISCONNECTED")
    const [topics, setTopics] = useState<Topic[]>([])
    const [subscribedTopic, setSubscribedTopic] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [users, setUsers] = useState<Record<string, ChatMember>>({})

    useEffect(() => {
        if (!auth) return

        function connect() {
            const ws = new WebSocket(`${WS_BASE}/chat/sync`)
            socketRef.current = ws

            setStatus("CONNECTING")

            ws.onopen = () => {
                setStatus("LIVE")

                // Authorize with token
                ws.send(
                    JSON.stringify({
                        action: "AUTHORIZE",
                        data: { token: auth }
                    })
                )

                // Request topics
                ws.send(JSON.stringify({ action: "GET_TOPICS", data: {} }))
            }

            ws.onmessage = (ev) => {
                try {
                    const response: ChatSyncResponse = JSON.parse(ev.data)
                    handleResponse(response)
                } catch {
                    /* ignore parse errors */
                }
            }

            ws.onerror = () => setStatus("ERROR")
            ws.onclose = () => {
                setStatus("DISCONNECTED")

                // Retry after 10 seconds
                setTimeout(connect, 10_000)
            }
        }

        connect()

        return () => {
            socketRef?.current?.close()
            socketRef.current = null
        }
    }, [auth])

    // Handle incoming responses
    const handleResponse = useCallback((response: ChatSyncResponse) => {
        switch (response.type) {
            case "TOPICS":
                setTopics(response.payload as Topic[])
                break

            case "TOPIC_CREATED":
                setTopics((prev) => [response.payload as Topic, ...prev])
                break

            case "SUBSCRIBED_TOPIC":
                setSubscribedTopic(response.payload as string)
                setMessages([])
                break

            case "UNSUBSCRIBED_TOPIC":
                setSubscribedTopic(null)
                setMessages([])
                break

            case "TOPIC_HISTORY":
                setMessages(response.payload as ChatMessage[])
                break

            case "NEW_TOPIC_MESSAGE":
                setMessages((prev) => [
                    ...prev,
                    response.payload as ChatMessage
                ])
                break

            case "USERS": {
                const fetchedUsers = response.payload as ChatMember[]

                setUsers((prev) => {
                    const updated = { ...prev }
                    for (const user of fetchedUsers) {
                        updated[user.userID] = user
                    }
                    return updated
                })

                break
            }

            case "TOPIC_UPDATED": {
                const updatedTopic = response.payload as Topic
                setTopics((prev) =>
                    prev.map((t) =>
                        t.id === updatedTopic.id ? updatedTopic : t
                    )
                )
                break
            }
        }
    }, [])

    // Send action to WebSocket
    const send = useCallback(
        (action: string, data: Record<string, string> = {}) => {
            const ws = socketRef.current
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action, data }))
            }
        },
        [socketRef]
    )

    // Topic actions
    const getTopics = useCallback(() => send("GET_TOPICS"), [send])

    const createTopic = useCallback(
        (name: string, description: string = "") => {
            send("CREATE_TOPIC", { name, description })
        },
        [send]
    )

    const subscribeTopic = useCallback(
        (topicID: string) => {
            send("SUBSCRIBE_TOPIC", { topicID })
            send("GET_TOPIC_HISTORY", { topicID, page: "0" })
        },
        [send]
    )

    const unsubscribeTopic = useCallback(
        (topicID: string) => {
            send("UNSUBSCRIBE_TOPIC", { topicID })
        },
        [send]
    )

    const sendTopicMessage = useCallback(
        (topicID: string, message: string) => {
            send("SEND_TOPIC_MESSAGE", { topicID, message })
        },
        [send]
    )

    const getTopicHistory = useCallback(
        (topicID: string, page: number = 0) => {
            send("GET_TOPIC_HISTORY", { topicID, page: page.toString() })
        },
        [send]
    )

    const getUsers = useCallback(
        (userIDs: string[]) => {
            if (userIDs.length === 0) return
            send("GET_USERS", { userIDs: userIDs.join(",") })
        },
        [send]
    )

    return {
        status,
        topics,
        subscribedTopic,
        messages,
        users,
        getTopics,
        createTopic,
        subscribeTopic,
        unsubscribeTopic,
        sendTopicMessage,
        getTopicHistory,
        getUsers
    }
}
