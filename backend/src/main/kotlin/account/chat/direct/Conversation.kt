package app.burrow.account.chat.direct

import app.burrow.account.chat.ChatMessage
import app.burrow.account.chat.ChatMessages
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import java.util.UUID

/**
 * A DM conversation between two users.
 *
 * @param id The unique conversation ID.
 * @param userOneID The first user's ID.
 * @param userTwoID The second user's ID.
 * @param createdAt When the conversation was created.
 * @param lastMessageAt When the last message was sent.
 */
@Serializable
data class Conversation(
    val id: String,
    val userOneID: String,
    val userTwoID: String,
    val createdAt: Long,
    val lastMessageAt: Long,
) {
    companion object {
        /**
         * Convert a [row] to a [Conversation].
         *
         * @param row The row containing a [Conversation].
         */
        fun fromRow(row: ResultRow): Conversation =
            Conversation(
                id = row[Conversations.id],
                userOneID = row[Conversations.userOneID],
                userTwoID = row[Conversations.userTwoID],
                createdAt = row[Conversations.createdAt],
                lastMessageAt = row[Conversations.lastMessageAt],
            )
    }

    /** Check if a [userId] is part of this conversation. */
    fun hasUser(userId: String): Boolean = userOneID == userId || userTwoID == userId

    /** Get the other user in the conversation given [userId]. */
    fun otherUser(userId: String): String = if (userOneID == userId) userTwoID else userOneID
}

/** Get all conversations for a user. */
suspend fun getConversationsForUser(userID: String): List<Conversation> = query {
    Conversations.selectAll()
        .where { (Conversations.userOneID eq userID) or (Conversations.userTwoID eq userID) }
        .orderBy(Conversations.lastMessageAt, SortOrder.DESC)
        .map { row -> Conversation.fromRow(row) }
        .toList()
}

/** Get a conversation by ID. */
suspend fun getConversation(conversationID: String): Conversation? = query {
    Conversations.selectAll()
        .where { Conversations.id eq conversationID }
        .map { row -> Conversation.fromRow(row) }
        .toList()
        .firstOrNull()
}

/** Get or create a conversation between two users. */
suspend fun getOrCreateConversation(userOne: String, userTwo: String): Conversation = query {
    val existing =
        Conversations.selectAll()
            .where {
                ((Conversations.userOneID eq userOne) and (Conversations.userTwoID eq userTwo)) or
                        ((Conversations.userOneID eq userTwo) and (Conversations.userTwoID eq userOne))
            }
            .map { row -> Conversation.fromRow(row) }
            .toList()
            .firstOrNull()

    if (existing != null) return@query existing

    val now = getTimeMillis()
    val id = UUID.randomUUID().toString()

    Conversations.insert {
        it[Conversations.id] = id
        it[Conversations.userOneID] = userOne
        it[Conversations.userTwoID] = userTwo
        it[Conversations.createdAt] = now
        it[Conversations.lastMessageAt] = now
    }

    Conversation(id, userOne, userTwo, now, now)
}

/**
 * Create a direct message.
 *
 * @param conversationID The ID of the conversation.
 * @param senderID The ID of the sender.
 * @param message The message contents.
 */
suspend fun createDirectMessage(
    conversationID: String,
    senderID: String,
    message: String,
): ChatMessage = query {
    val now = getTimeMillis()
    val id = UUID.randomUUID()

    ChatMessages.insert {
        it[ChatMessages.id] = id
        it[ChatMessages.parentID] = conversationID
        it[ChatMessages.senderID] = senderID
        it[ChatMessages.message] = message
        it[ChatMessages.createdAt] = now
    }

    // Update last message timestamp
    Conversations.update({ Conversations.id eq conversationID }) { it[lastMessageAt] = now }

    ChatMessage(id, conversationID, senderID, message, now)
}

/**
 * Get a page of messages in a conversation.
 *
 * @param conversationID The ID of the conversation.
 * @param page The page number.
 * @param pageSize The size of the pages.
 */
suspend fun getConversationHistory(
    conversationID: String,
    page: Int,
    pageSize: Int = 50,
): List<ChatMessage> = query {
    ChatMessages.selectAll()
        .where { ChatMessages.parentID eq conversationID }
        .orderBy(ChatMessages.createdAt, SortOrder.DESC)
        .limit(pageSize)
        .offset((page * pageSize).toLong())
        .map { row -> ChatMessage.fromRow(row) }
        .toList()
        .reversed() // Return in chronological order
}