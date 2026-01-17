import { useEffect, useRef, useState, useCallback } from "react"
import { BASE_URL } from "@api/util"
import useToken from "@features/auth/hooks/useToken"
import type { ChatMessage, ChatMember, ChatSyncStatus } from "../chat.types"
import type { Response, Action } from "@features/chat/sync.types"

/**
 * Hook for syncing with burrow chat via WebSocket.
 * Connects to /burrows/{burrowID}/sync endpoint.
 */
export default function useBurrowChat(
    burrowID: string | null,
    isJoined: boolean
) {
    const auth = useToken()
    const socketRef = useRef<WebSocket | null>(null)
    const shouldConnectRef = useRef(false)

    const [status, setStatus] = useState<ChatSyncStatus>("DISCONNECTED")
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [members, setMembers] = useState<Record<string, ChatMember>>({})
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)

    const WS_BASE = BASE_URL.replace("http", "ws")

    // Send action to WebSocket
    const sendAction = useCallback(
        (block: string, action: string, data: Record<string, any> = {}) => {
            const ws = socketRef.current
            if (ws && ws.readyState === WebSocket.OPEN) {
                const payload: Action = { block, action, data }
                ws.send(JSON.stringify(payload))
            }
        },
        []
    )

    // Connect to burrow sync WebSocket
    useEffect(() => {
        if (!auth || !burrowID || !isJoined) {
            setStatus("DISCONNECTED")
            return
        }

        shouldConnectRef.current = true

        function connect() {
            const ws = new WebSocket(`${WS_BASE}/burrows/${burrowID}/sync`)
            socketRef.current = ws

            setStatus("CONNECTING")

            ws.onopen = () => {
                setStatus("LIVE")

                // Authorize
                sendAction("SYNC", "AUTHORIZE", { token: auth })
            }

            ws.onmessage = (ev) => {
                try {
                    const payload: Response = JSON.parse(ev.data)

                    // Only handle CHAT block messages
                    if (payload.block !== "CHAT") return

                    if (payload.burrowID !== burrowID) return

                    switch (payload.type) {
                        case "HISTORY": {
                            const messageHistory = payload.payload
                                .messages as ChatMessage[]
                            setMessages(
                                messageHistory.sort(
                                    (a, b) => a.createdAt - b.createdAt
                                )
                            )
                            break
                        }

                        case "NEW_MESSAGE": {
                            const newMsg = payload.payload as ChatMessage
                            setMessages((prev) => [...prev, newMsg])
                            break
                        }

                        case "MESSAGE_DELETED": {
                            const { messageID, userID } = payload.payload
                            setMessages((prev) =>
                                userID
                                    ? prev.filter(
                                          (msg) => msg.senderID !== userID
                                      )
                                    : prev.filter((msg) => msg.id !== messageID)
                            )
                            break
                        }

                        case "MESSAGE_UPDATED": {
                            const { messageID, newMessage } = payload.payload
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === messageID
                                        ? { ...msg, message: newMessage }
                                        : msg
                                )
                            )
                            break
                        }

                        case "MEMBERS": {
                            const membersList = payload.payload as ChatMember[]
                            setMembers((prev) => {
                                const updated = { ...prev }
                                for (const member of membersList) {
                                    updated[member.userID] = member
                                }
                                return updated
                            })
                            break
                        }

                        case "PINNED_MESSAGE": {
                            setPinnedMessage(
                                payload.payload
                                    ? (payload.payload as ChatMessage)
                                    : null
                            )
                            break
                        }
                    }
                } catch (error) {
                    console.error("Chat message parse error:", error)
                }
            }

            ws.onerror = () => setStatus("ERROR")

            ws.onclose = () => {
                setStatus("DISCONNECTED")

                // Retry connection after 10 seconds if still should connect
                if (shouldConnectRef.current) {
                    setTimeout(() => {
                        if (shouldConnectRef.current) {
                            connect()
                        }
                    }, 10000)
                }
            }
        }

        console.log("hi")
        connect()

        return () => {
            shouldConnectRef.current = false
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }
        }
    }, [auth, burrowID, isJoined, WS_BASE, sendAction])

    // Chat actions
    const sendMessage = useCallback(
        (message: string) => {
            sendAction("CHAT", "CREATE_MESSAGE", { message })
        },
        [sendAction]
    )

    const deleteMessage = useCallback(
        (messageId: string) => {
            sendAction("CHAT", "DELETE_MESSAGE", { id: messageId })
        },
        [sendAction]
    )

    const editMessage = useCallback(
        (messageId: string, newMessage: string) => {
            sendAction("CHAT", "EDIT_MESSAGE", {
                id: messageId,
                contents: newMessage
            })
        },
        [sendAction]
    )

    const pinMessage = useCallback(
        (messageId: string) => {
            sendAction("CHAT", "PIN_MESSAGE", { messageID: messageId })
        },
        [sendAction]
    )

    const unpinMessage = useCallback(() => {
        sendAction("CHAT", "UN_PIN_MESSAGE", {})
    }, [sendAction])

    return {
        status,
        messages,
        members,
        pinnedMessage,
        sendMessage,
        deleteMessage,
        editMessage,
        pinMessage,
        unpinMessage
    }
}
