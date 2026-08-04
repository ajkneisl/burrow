import type { ChatMember, ChatMessage } from "@umnburrow/core/api"
import { View } from "react-native"
import { useState, useEffect } from "react"
import { useAtomValue } from "jotai"
import { Card, Text } from "@components/core"
import GenericChatBox from "./GenericChatBox"

import { syncStatus } from "@features/sync/sync.atom"
import { type SyncIncomingEvent, SyncOutgoingEvent } from "@features/sync/sync.types"
import { eventBus } from "@features/sync/eventBus"
import useUser from "@features/auth/hooks/useUser"

type BurrowChatProps = {
    burrowId: string
    isMember: boolean
    /** Render without Card wrapper, filling available space */
    fullScreen?: boolean
}

/**
 * Chat component for burrow detail page.
 * Handles all chat functionality using event bus pattern.
 */
export function BurrowChat({ burrowId, isMember, fullScreen }: BurrowChatProps) {
    const user = useUser()
    const status = useAtomValue(syncStatus)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [members, setMembers] = useState<Record<string, ChatMember>>({})
    const [chatText, setChatText] = useState("")
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
        null
    )

    // Request history & members when mounting with an already-live connection
    useEffect(() => {
        if (status !== "LIVE") return

        eventBus.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "RECEIVE_HISTORY",
                data: {}
            })
        )

        eventBus.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "RECEIVE_MEMBERS",
                data: {}
            })
        )
    }, [status])

    // Listen for incoming chat events
    useEffect(() => {
        const logPrefix = `[Chat: ${burrowId}]`
        console.log(`${logPrefix} Setting up event listener for CHAT_INCOMING`)

        function onChatIncoming(event: SyncIncomingEvent) {
            const payload = event.response
            console.log(`${logPrefix} Received CHAT event:`, payload.type)

            if (payload.burrowID !== burrowId) {
                console.log(
                    `${logPrefix} Ignoring event - different burrow`,
                    payload.burrowID,
                    "vs",
                    burrowId
                )
                return
            }

            switch (payload.type) {
                // Receive message history
                case "HISTORY": {
                    console.log(
                        `${logPrefix} Received message history:`,
                        payload.payload.messages?.length
                    )
                    const messageHistory = payload.payload
                        .messages as ChatMessage[]
                    setMessages(
                        messageHistory.sort((a, b) => a.createdAt - b.createdAt)
                    )
                    break
                }

                // Receive member names
                case "MEMBERS": {
                    console.log(
                        `${logPrefix} Received members:`,
                        payload.payload?.length
                    )
                    const membersList: ChatMember[] = payload.payload

                    for (let i = 0; i < membersList.length; i++) {
                        const member = membersList[i]
                        setMembers((prev) => ({
                            ...prev,
                            [member.userID]: member
                        }))
                    }
                    break
                }

                // Incoming message
                case "NEW_MESSAGE":
                    console.log(`${logPrefix} New message received`)
                    setMessages((prev) => [
                        ...prev,
                        payload.payload as ChatMessage
                    ])
                    break

                // Deleted message
                case "MESSAGE_DELETED":
                    console.log(`${logPrefix} Message deleted`)
                    setMessages((prev) =>
                        prev.filter(
                            (message) =>
                                message.id !== payload.payload.messageID
                        )
                    )
                    break

                // Updated message
                case "MESSAGE_UPDATED":
                    console.log(`${logPrefix} Message updated`)
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.payload.messageID
                                ? {
                                      ...msg,
                                      message: payload.payload.newMessage
                                  }
                                : msg
                        )
                    )
                    break

                default:
                    console.log(`${logPrefix} Unknown message type:`, payload.type)
            }
        }

        eventBus.addEventListener("CHAT_INCOMING", onChatIncoming)

        return () => {
            console.log(`${logPrefix} Removing event listener`)
            eventBus.removeEventListener("CHAT_INCOMING", onChatIncoming)
        }
    }, [burrowId])

    const handleSendMessage = () => {
        const logPrefix = `[Chat: ${burrowId}]`
        console.log(`${logPrefix} handleSendMessage called`, {
            hasText: !!chatText.trim(),
            isEditing: !!editingMessage,
            status
        })

        if (chatText.trim() === "") return
        if (status !== "LIVE") {
            console.log(`${logPrefix} Cannot send - not connected`)
            return
        }

        if (editingMessage) {
            // Edit existing message
            console.log(
                `${logPrefix} Editing message:`,
                editingMessage.id,
                chatText
            )
            eventBus.dispatchEvent(
                new SyncOutgoingEvent({
                    block: "CHAT",
                    action: "EDIT_MESSAGE",
                    data: { contents: chatText.trim(), id: editingMessage.id }
                })
            )
            setEditingMessage(null)
        } else {
            // Send new message
            console.log(`${logPrefix} Sending new message:`, chatText)
            eventBus.dispatchEvent(
                new SyncOutgoingEvent({
                    block: "CHAT",
                    action: "CREATE_MESSAGE",
                    data: { message: chatText.trim() }
                })
            )
        }

        setChatText("")
    }

    const handleEditMessage = (message: ChatMessage) => {
        const logPrefix = `[Chat: ${burrowId}]`
        console.log(`${logPrefix} Starting edit:`, message.id)
        setEditingMessage(message)
        setChatText(message.message)
    }

    const handleDeleteMessage = (messageId: string) => {
        const logPrefix = `[Chat: ${burrowId}]`
        console.log(`${logPrefix} Deleting message:`, messageId)
        if (status !== "LIVE") {
            console.log(`${logPrefix} Cannot delete - not connected`)
            return
        }

        eventBus.dispatchEvent(
            new SyncOutgoingEvent({
                block: "CHAT",
                action: "DELETE_MESSAGE",
                data: { id: messageId }
            })
        )
    }

    const canEditMessage = (message: ChatMessage) => {
        return message.senderID === user?.id
    }

    const canDeleteMessage = (message: ChatMessage) => {
        // Users can delete their own messages
        // Host and moderators handled separately if needed
        return message.senderID === user?.id
    }

    const handleCancelEdit = () => {
        const logPrefix = `[Chat: ${burrowId}]`
        console.log(`${logPrefix} Canceling edit`)
        setEditingMessage(null)
        setChatText("")
    }

    const chatBox = (
        <GenericChatBox
            status={status}
            messages={messages}
            members={members}
            text={chatText}
            onTextChange={setChatText}
            onSend={handleSendMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            canEdit={canEditMessage}
            canDelete={canDeleteMessage}
            isEditing={!!editingMessage}
            onCancelEdit={handleCancelEdit}
            placeholder="Type a message..."
            disconnectedPlaceholder="Connecting to chat..."
        />
    )

    if (fullScreen) {
        return <View className="flex-1">{chatBox}</View>
    }

    return (
        <Card variant="bordered">
            <Text className="text-lg font-semibold text-text mb-3">Chat</Text>
            <View className="h-96 rounded-lg overflow-hidden">
                {chatBox}
            </View>
        </Card>
    )
}
