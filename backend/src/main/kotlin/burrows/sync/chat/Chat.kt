package app.burrow.burrows.sync.chat

import app.burrow.account.Users
import app.burrow.account.chat.ChatMessage
import app.burrow.account.chat.ChatMessages
import app.burrow.account.profile.Profiles
import app.burrow.burrows.getMeetingResponse
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.sync.BurrowSync
import app.burrow.burrows.sync.block.Block
import app.burrow.burrows.sync.block.RegisterBlock
import app.burrow.burrows.sync.models.Response
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * The `Chats` block.
 *
 * This handles the chatbox, with functionality like:
 * - creating messages
 * - deleting messages
 * - editing messages
 * - receiving history
 */
@RegisterBlock
class Chat(burrowID: String) : Block("CHAT", burrowID) {
    companion object {
        private const val MESSAGE_MAX_LENGTH = 512
        private const val MESSAGE_MIN_LENGTH = 1
    }

    /** Actions from the client. */
    enum class Incoming {
        CREATE_MESSAGE,
        DELETE_MESSAGE,
        EDIT_MESSAGE,
        RECEIVE_HISTORY,
        RECEIVE_MEMBERS,
    }

    /** Actions from the server. */
    enum class Outgoing {
        NEW_MESSAGE,
        MESSAGE_DELETED,
        MESSAGE_UPDATED,
        HISTORY,
        MEMBERS,
    }

    /** A member in the chat. */
    @Serializable data class ChatMember(val userID: String, val username: String, val name: String)

    /** Get all chat members from a meeting. */
    suspend fun getChatMembers(): List<ChatMember> {
        val members = query {
            Memberships.innerJoin(Users, { Memberships.userID }, { Users.id })
                .innerJoin(Profiles, { Memberships.userID }, { Profiles.userID })
                .select(Memberships.userID, Users.username, Profiles.name)
                .where { Memberships.burrowID eq meetingId }
                .map { member ->
                    ChatMember(
                        member[Memberships.userID],
                        member[Users.username],
                        member[Profiles.name],
                    )
                }
                .toList()
        }

        return members
    }

    /**
     * Get a chat message from a meeting.
     *
     * @param messageId The ID of the message within the meeting.
     */
    suspend fun getChatMessage(messageId: UUID): ChatMessage? = query {
        ChatMessages.selectAll()
            .where {
                (ChatMessages.parentID eq meetingId) and (ChatMessages.id eq messageId)
            }
            .map { ChatMessage.fromRow(it) }
            .firstOrNull()
    }

    /**
     * Validate a message to ensure it's appropriate for Burrow.
     *
     * This includes swear filtering & length checking.
     */
    private fun validateChatMessage(message: String): Boolean {
        // TODO: swear filtering
        return message.length in MESSAGE_MIN_LENGTH..MESSAGE_MAX_LENGTH
    }

    /**
     * A segment of chat history in a meeting.
     *
     * @param page The page of chats.
     * @param pageCount The amount of pages in the history.
     * @param messages The page of messages.
     */
    @Serializable
    data class ChatHistory(val page: Long, val pageCount: Long, val messages: List<ChatMessage>) {
        companion object {
            /** The amount of messages seen per page. */
            const val CHAT_PAGE_LIMIT = 50
        }
    }

    /** Receive history. */
    private suspend fun UserBlockRequestState.wsReceiveHistory() {
        val page = data["page"]?.toLongOrNull() ?: 0

        val (messages, pageCount) =
            query {
                val messages =
                    ChatMessages.selectAll()
                        .where { ChatMessages.parentID eq this@Chat.meetingId }
                        .orderBy(ChatMessages.createdAt, SortOrder.DESC)
                        .offset(page * ChatHistory.CHAT_PAGE_LIMIT)
                        .limit(ChatHistory.CHAT_PAGE_LIMIT)
                        .toList()
                        .map { row -> ChatMessage.fromRow(row) }

                val pageCount =
                    ChatMessages.selectAll()
                        .where { ChatMessages.parentID eq this@Chat.meetingId }
                        .count()
                        .div(ChatHistory.CHAT_PAGE_LIMIT)

                messages to pageCount
            }

        val chatHistory = ChatHistory(page, pageCount, messages)

        sendResponse(Outgoing.HISTORY, chatHistory)
    }

    /** @see wsEditMessage */
    @Serializable
    data class EditedMessage(
        @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val messageId: UUID,
        val newMessage: String,
    )

    /** Edit a message. */
    private suspend fun UserBlockRequestState.wsEditMessage() {
        val messageId = data["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val newContents = data["contents"]

        if (messageId == null || newContents == null) return sendError("Invalid arguments.")

        if (!validateChatMessage(newContents)) return sendError("Invalid message.")

        val meeting = getMeetingResponse(meetingId, userId)
        val message = getChatMessage(messageId)

        if (meeting == null || message == null || meeting.membership == null)
            return sendError("Invalid message ID.")

        if (message.senderID != userId)
            return sendError("You do not have permission to edit this message.")

        query {
            ChatMessages.update({
                (ChatMessages.parentID eq this@Chat.meetingId) and
                    (ChatMessages.id eq messageId)
            }) {
                it[ChatMessages.message] = newContents
            }
        }

        broadcastResponse(Outgoing.MESSAGE_UPDATED, EditedMessage(messageId, newContents))
    }

    /** @see wsDeleteMessage */
    @Serializable
    data class DeletedMessage(
        @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val messageId: UUID
    )

    /** Delete a message. */
    private suspend fun UserBlockRequestState.wsDeleteMessage() {
        val messageId =
            data["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: return sendError("Invalid message ID.")

        val meeting = getMeetingResponse(meetingId, userId)
        val membership = meeting?.membership
        val message = getChatMessage(messageId)

        if (meeting == null || message == null || membership == null)
            return sendError("Invalid message ID.")

        val isModerator =
            membership.role == BurrowRole.HOST || membership.role == BurrowRole.MODERATOR

        val isMessageOwner = message.senderID == userId

        if (!isModerator && !isMessageOwner)
            return sendError("You do not have permission to delete this message.")

        query {
            ChatMessages.deleteWhere {
                (ChatMessages.parentID eq this@Chat.meetingId) and
                    (ChatMessages.id eq messageId)
            }
        }

        BurrowSync.broadcast(
            meetingId,
            Response(blockId, Outgoing.MESSAGE_DELETED, payload = DeletedMessage(messageId)),
        )
    }

    /** Create a message. */
    private suspend fun UserBlockRequestState.wsCreateMessage() {
        val message = data["message"]

        if (message == null || !validateChatMessage(message)) {
            sendError("Invalid message.")
            return
        }

        val time = getTimeMillis()
        val messageId = UUID.randomUUID()

        // create message
        query {
            ChatMessages.insert {
                it[ChatMessages.id] = messageId
                it[ChatMessages.message] = message
                it[ChatMessages.senderID] = this@wsCreateMessage.userId
                it[ChatMessages.parentID] = this@Chat.meetingId
                it[ChatMessages.createdAt] = time
            }
        }

        val chatMessage = ChatMessage(
            id = messageId,
            parentID = meetingId,
            senderID = userId,
            message = message,
            createdAt = time
        )

        BurrowSync.broadcast<ChatMessage>(meetingId, Response(blockId, Outgoing.NEW_MESSAGE, chatMessage))
    }

    /** Receive members. */
    private suspend fun UserBlockRequestState.wsReceiveMembers() {
        sendResponse(Outgoing.MEMBERS, getChatMembers())
    }

    override val onIncoming: IncomingRequest = {
        when (action.asAction<Incoming>()) {
            Incoming.CREATE_MESSAGE -> wsCreateMessage()
            Incoming.DELETE_MESSAGE -> wsDeleteMessage()
            Incoming.EDIT_MESSAGE -> wsEditMessage()
            Incoming.RECEIVE_HISTORY -> wsReceiveHistory()
            Incoming.RECEIVE_MEMBERS -> wsReceiveMembers()

            null -> invalidAction()
        }
    }
}
