/**
 * An individual chat message.
 *
 * Matches the generic ChatMessages table from account.chat.
 *
 * @param id The unique ID of the message.
 * @param parentID The parent entity this message belongs to (topic room ID or conversation ID).
 * @param senderID The ID of the author.
 * @param message The contents of the message.
 * @param createdAt When the chat was sent.
 */
export type ChatMessage = {
    id: string
    parentID: string
    senderID: string
    message: string
    createdAt: number
}

/**
 * A member of the chat.
 *
 * @param userID The ID of the user.
 * @param username The username of the user.
 * @param name The name of the user.
 */
export type ChatMember = {
    userID: string
    username: string
    name: string
}

/**
 * A topic room for global chat.
 */
export type Topic = {
    id: string
    name: string
    description: string
    createdBy: string
    createdAt: number
    pinned: boolean
    expiresAt: number | null
}

/**
 * Chat sync status.
 */
export type ChatSyncStatus = "LIVE" | "DISCONNECTED" | "ERROR" | "CONNECTING"

/**
 * Chat sync response from the server.
 */
export type ChatSyncResponse = {
    type: string
    payload: unknown
}