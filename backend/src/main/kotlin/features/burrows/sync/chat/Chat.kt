package app.burrow.features.burrows.sync.chat

import app.burrow.api.Errors
import app.burrow.features.account.models.Users
import app.burrow.features.account.chat.ChatMessage
import app.burrow.features.account.chat.ChatMessages
import app.burrow.features.account.profile.Profiles
import app.burrow.features.burrows.getBurrowResponse
import app.burrow.features.burrows.membership.Memberships
import app.burrow.features.burrows.membership.isModerator
import app.burrow.features.burrows.models.BurrowRole
import app.burrow.features.burrows.sync.BurrowSync
import app.burrow.features.burrows.sync.block.Block
import app.burrow.features.burrows.sync.block.RegisterBlock
import app.burrow.features.burrows.sync.models.Response
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

        const val PINNED_MESSAGE = "PINNED_MESSAGE"
    }

    /** Actions from the client. */
    enum class Incoming {
        // update content
        CREATE_MESSAGE,
        DELETE_MESSAGE,
        EDIT_MESSAGE,

        // get content
        RECEIVE_HISTORY,
        RECEIVE_MEMBERS,
        RECEIVE_PINNED,

        // manage pinned message
        PIN_MESSAGE,
        UN_PIN_MESSAGE,
    }

    /** Actions from the server. */
    enum class Outgoing {
        NEW_MESSAGE,
        MESSAGE_DELETED,
        MESSAGE_UPDATED,
        HISTORY,
        MEMBERS,
        PINNED_MESSAGE,
    }

    /** A member in the chat. */
    @Serializable data class ChatMember(val userID: String, val username: String, val name: String)

    /** Get all chat members from a meeting. */
    suspend fun getChatMembers(): List<ChatMember> {
        val members = query {
            Memberships.innerJoin(Users, { Memberships.userID }, { Users.id })
                .innerJoin(Profiles, { Memberships.userID }, { Profiles.userID })
                .select(Memberships.userID, Users.username, Profiles.name)
                .where { Memberships.burrowID eq burrowID }
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
            .where { (ChatMessages.parentID eq burrowID) and (ChatMessages.id eq messageId) }
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
                        .where { ChatMessages.parentID eq this@Chat.burrowID }
                        .orderBy(ChatMessages.createdAt, SortOrder.DESC)
                        .offset(page * ChatHistory.CHAT_PAGE_LIMIT)
                        .limit(ChatHistory.CHAT_PAGE_LIMIT)
                        .toList()
                        .map { row -> ChatMessage.fromRow(row) }

                val pageCount =
                    ChatMessages.selectAll()
                        .where { ChatMessages.parentID eq this@Chat.burrowID }
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
        @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val messageID: UUID,
        val newMessage: String,
    )

    /** Edit a message. */
    private suspend fun UserBlockRequestState.wsEditMessage() {
        val messageId = data["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val newContents = data["contents"]

        if (messageId == null || newContents == null) return sendError("Invalid arguments.")

        if (!validateChatMessage(newContents)) return sendError("Invalid message.")

        val meeting = getBurrowResponse(burrowID, userID)
        val message = getChatMessage(messageId)

        if (meeting == null || message == null || meeting.membership == null)
            return sendError("Invalid message ID.")

        if (message.senderID != userID)
            return sendError("You do not have permission to edit this message.")

        query {
            ChatMessages.update({
                (ChatMessages.parentID eq this@Chat.burrowID) and (ChatMessages.id eq messageId)
            }) {
                it[ChatMessages.message] = newContents
            }
        }

        broadcastResponse(Outgoing.MESSAGE_UPDATED, EditedMessage(messageId, newContents))
    }

    /** @see wsDeleteMessage */
    @Serializable
    data class DeletedMessage(
        @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val messageID: UUID
    )

    /** Delete a message. */
    private suspend fun UserBlockRequestState.wsDeleteMessage() {
        val messageID =
            data["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: return sendError("Invalid message ID.")

        val meeting = getBurrowResponse(burrowID, userID)
        val membership = meeting?.membership
        val message = getChatMessage(messageID)

        if (meeting == null || message == null || membership == null)
            return sendError("Invalid message ID.")

        val isModerator =
            membership.role == BurrowRole.HOST || membership.role == BurrowRole.MODERATOR

        val isMessageOwner = message.senderID == userID

        if (!isModerator && !isMessageOwner)
            return sendError("You do not have permission to delete this message.")

        query {
            ChatMessages.deleteWhere {
                (ChatMessages.parentID eq this@Chat.burrowID) and (ChatMessages.id eq messageID)
            }
        }

        if (getState()[PINNED_MESSAGE] == messageID.toString()) {
            setState(getState().apply { remove(PINNED_MESSAGE) })
        }

        BurrowSync.broadcast(
            burrowID,
            Response(
                this@Chat.blockID,
                Outgoing.MESSAGE_DELETED,
                payload = DeletedMessage(messageID),
            ),
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
                it[ChatMessages.senderID] = this@wsCreateMessage.userID
                it[ChatMessages.parentID] = this@Chat.burrowID
                it[ChatMessages.createdAt] = time
            }
        }

        val chatMessage =
            ChatMessage(
                id = messageId,
                parentID = burrowID,
                senderID = userID,
                message = message,
                createdAt = time,
            )

        BurrowSync.broadcast<ChatMessage>(
            burrowID,
            Response(this@Chat.blockID, Outgoing.NEW_MESSAGE, chatMessage),
        )
    }

    /** Receive members. */
    private suspend fun UserBlockRequestState.wsReceiveMembers() {
        sendResponse(Outgoing.MEMBERS, getChatMembers())
    }

    /**
     * -> [Incoming.PIN_MESSAGE]
     *
     * Pin a message to the chat box.
     */
    private suspend fun UserBlockRequestState.wsPinMessage() {
        if (userID isModerator burrowID) {
            val messageID =
                data["messageID"]?.let { UUID.fromString(it) }
                    ?: return sendError(Errors.INVALID_ARGUMENTS)

            val chatMessage = getChatMessage(messageID)
            if (chatMessage?.parentID != burrowID) return sendError(Errors.INVALID_ARGUMENTS)

            val currentState = getState()
            currentState[PINNED_MESSAGE] = messageID.toString()

            setState(currentState)

            sendResponse(Outgoing.PINNED_MESSAGE, chatMessage)
        } else {
            sendError(Errors.INVALID_AUTHORIZATION)
        }
    }

    /**
     * -> [Incoming.UN_PIN_MESSAGE]
     *
     * Un-pin the current chat message.
     */
    private suspend fun UserBlockRequestState.wsUnPinMessage() {
        if (userID isModerator burrowID) {
            setState(getState().apply { remove(PINNED_MESSAGE) })

            sendResponse(Outgoing.PINNED_MESSAGE, null)
        } else {
            sendError(Errors.INVALID_AUTHORIZATION)
        }
    }

    /**
     * -> [Incoming.RECEIVE_PINNED]
     *
     * Get the current pinned message.
     */
    private suspend fun UserBlockRequestState.wsReceivePinned() {
        val currentPinnedMessage = getState()[PINNED_MESSAGE]

        sendResponse(
            Outgoing.PINNED_MESSAGE,
            if (currentPinnedMessage == null) null
            else getChatMessage(UUID.fromString(currentPinnedMessage)),
        )
    }

    override val onIncoming: IncomingRequest = {
        when (action.asAction<Incoming>()) {
            Incoming.CREATE_MESSAGE -> wsCreateMessage()
            Incoming.DELETE_MESSAGE -> wsDeleteMessage()
            Incoming.EDIT_MESSAGE -> wsEditMessage()

            Incoming.RECEIVE_PINNED -> wsReceivePinned()
            Incoming.RECEIVE_HISTORY -> wsReceiveHistory()
            Incoming.RECEIVE_MEMBERS -> wsReceiveMembers()

            Incoming.PIN_MESSAGE -> wsPinMessage()
            Incoming.UN_PIN_MESSAGE -> wsUnPinMessage()

            null -> invalidAction()
        }
    }
    override val onWelcome: suspend UserBlockRequestState.() -> Unit = {
        wsReceivePinned()
        wsReceiveHistory()
        wsReceiveMembers()
    }

    override val defaultState: HashMap<String, String> = hashMapOf()
}
