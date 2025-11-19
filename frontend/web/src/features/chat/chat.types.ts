/**
 * An individual chat message.
 *
 * @param date When the chat was sent.
 * @param message The contents of the message.
 * @param messageId The unique ID of the message.
 * @param userId The ID of the author.
 */
export type ChatMessage = {
    date: number
    message: string
    messageID: string
    userID: string
}

/**
 * A member of the chat.
 *
 * @param userId The ID of the user.
 * @param username The username of the user.
 * @param name The name of the user.
 */
export type ChatMember = {
    userID: string
    username: string
    name: string
}
