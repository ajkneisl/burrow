package app.burrow.account.chat

import app.burrow.InvalidAuthorization
import app.burrow.NotFound
import app.burrow.PRIMARY_AUTH
import app.burrow.account.chat.direct.Conversation
import app.burrow.account.chat.direct.createDirectMessage
import app.burrow.account.chat.direct.getConversation
import app.burrow.account.chat.direct.getConversationHistory
import app.burrow.account.chat.direct.getConversationsForUser
import app.burrow.account.chat.direct.getOrCreateConversation
import app.burrow.account.chat.topic.createTopic
import app.burrow.account.chat.topic.createTopicMessage
import app.burrow.account.chat.topic.deleteTopic
import app.burrow.account.chat.topic.getAllTopics
import app.burrow.account.chat.topic.getTopic
import app.burrow.account.chat.topic.getTopicHistory
import app.burrow.account.chat.topic.getUsersByIDs
import app.burrow.account.models.userID
import app.burrow.intQueryParameter
import app.burrow.socket.SocketSession
import app.burrow.socket.UserSessionManager
import app.burrow.socket.authenticatedWebSocket
import app.burrow.socket.sendPayload
import app.burrow.socket.sendResponse
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.util.date.getTimeMillis
import kotlinx.serialization.Serializable

/**
 * Handles the syncing between conversations between users. This includes topics and private
 * messages.
 *
 * @see Conversation
 * @see ChatMessage
 */
object ChatSync {
    /**
     * An individual user's session.
     *
     * @param userID The user in the session.
     * @param session The actual websocket.
     * @param joinedAt When the user initially connected.
     * @param subscribedConversations Conversation IDs the user is subscribed to.
     * @param subscribedTopics Topic room IDs the user is subscribed to.
     */
    data class Session(
        override val userID: String,
        override val session: WebSocketServerSession,
        override val joinedAt: Long,
        val subscribedConversations: MutableSet<String> = mutableSetOf(),
        val subscribedTopics: MutableSet<String> = mutableSetOf(),
    ) : SocketSession

    /** Incoming actions. */
    enum class Actions {
        AUTHORIZE,

        // User actions
        GET_USERS,

        // DM actions
        GET_CONVERSATIONS,
        GET_OR_CREATE_CONVERSATION,
        SUBSCRIBE_CONVERSATION,
        UNSUBSCRIBE_CONVERSATION,
        SEND_DM,
        GET_DM_HISTORY,

        // Topic actions
        GET_TOPICS,
        CREATE_TOPIC,
        SUBSCRIBE_TOPIC,
        UNSUBSCRIBE_TOPIC,
        SEND_TOPIC_MESSAGE,
        GET_TOPIC_HISTORY,
    }

    /** Outgoing response types. */
    enum class Responses {
        INVALID_DATA,
        NO_PERMISSION,

        // User responses
        USERS,

        // DM responses
        CONVERSATIONS,
        CONVERSATION,
        SUBSCRIBED_CONVERSATION,
        UNSUBSCRIBED_CONVERSATION,
        NEW_DM,
        DM_HISTORY,

        // Topic responses
        TOPICS,
        TOPIC_CREATED,
        TOPIC_UPDATED,
        SUBSCRIBED_TOPIC,
        UNSUBSCRIBED_TOPIC,
        NEW_TOPIC_MESSAGE,
        TOPIC_HISTORY,
    }

    /** Session manager for chat sync sessions. */
    val sessionManager = UserSessionManager<Session>()

    val CHAT_SYNC_ROUTES: Route.() -> Unit = {
        authenticate(PRIMARY_AUTH) {
            // ROUTE /chat/topics
            // manage topics
            route("/topics") {
                // GET /chat/topics
                // get all topics
                get {
                    val page = call.intQueryParameter("page")

                    call.respond(getAllTopics(page))
                }

                /**
                 * A request to create a topic request.
                 *
                 * @param name The name of the topic.
                 * @param description The description of the topic.
                 */
                @Serializable
                data class CreateTopicRequest(val name: String, val description: String? = null)

                // PUT /chat/topics
                // create a topic
                put {
                    val (name, description) = call.receive<CreateTopicRequest>()

                    createTopic(name, description ?: "", call.userID)

                    call.respond(HttpStatusCode.Created)
                }

                // ROUTE /chat/topics/{id}
                // manage specific topics
                route("/{id}") {
                    // GET /chat/topics/{id}
                    // get a specific topic
                    get {
                        val topicID = call.urlParameter("id")
                        val topic = getTopic(topicID) ?: throw NotFound()

                        call.respond(topic)
                    }

                    // DELETE /chat/topics/{id}
                    // delete a specific topic
                    delete {
                        val topicID = call.urlParameter("id")
                        val topic = getTopic(topicID) ?: throw NotFound()

                        // must be owner
                        if (topic.createdBy != call.userID) throw InvalidAuthorization()

                        deleteTopic(topicID)

                        call.respond(HttpStatusCode.OK)
                    }
                }
            }
        }

        // WS /chat/sync
        // sync for conversations and topics.
        authenticatedWebSocket<Actions>("/sync") {
            authorizeAction = Actions.AUTHORIZE
            isAlreadyConnected = { userID -> sessionManager.hasSession(userID) }
            onConnect = { userID -> sessionManager.join(Session(userID, this, getTimeMillis())) }
            onDisconnect = { userID -> sessionManager.leave(userID, true) }
            onAction = { userID, action, data, _ -> handleAction(userID, action, data) }
        }
    }

    /**
     * Handle an incoming action.
     *
     * @param userID The user performing the action.
     * @param action The action to perform.
     * @param data The data accompanying the action.
     */
    private suspend fun WebSocketServerSession.handleAction(
        userID: String,
        action: Actions,
        data: HashMap<String, String>,
    ) {
        when (action) {
            // authorize is handled by the wrapper
            Actions.AUTHORIZE -> {}

            // get all topics
            Actions.GET_TOPICS -> {
                sendPayload(Responses.TOPICS, getAllTopics(1))
            }

            // get user information by IDs
            Actions.GET_USERS -> {
                val userIDs =
                    data["userIDs"]?.split(",")?.filter { it.isNotBlank() }
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing userIDs")

                if (userIDs.size > 50) {
                    return sendResponse(Responses.INVALID_DATA, "Maximum 50 users at a time.")
                }

                val users = getUsersByIDs(userIDs)
                sendPayload(Responses.USERS, users)
            }

            // get the user's conversations
            Actions.GET_CONVERSATIONS -> {
                val conversations = getConversationsForUser(userID)
                sendPayload(Responses.CONVERSATIONS, conversations)
            }

            // get or create a conversation
            Actions.GET_OR_CREATE_CONVERSATION -> {
                val otherUserId =
                    data["userID"] ?: return sendResponse(Responses.INVALID_DATA, "Missing userID")

                val conversation = getOrCreateConversation(userID, otherUserId)
                sendPayload(Responses.CONVERSATION, conversation)
            }

            // subscribe to a conversation
            Actions.SUBSCRIBE_CONVERSATION -> {
                val conversationId =
                    data["conversationID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing conversationID")

                // ensure they can subscribe
                val conversation = getConversation(conversationId)
                if (conversation == null || !conversation.hasUser(userID)) {
                    return sendResponse(Responses.NO_PERMISSION, "Cannot access this conversation.")
                }

                sessionManager.getSession(userID)?.subscribedConversations?.add(conversationId)
                sendResponse(Responses.SUBSCRIBED_CONVERSATION, conversationId)
            }

            // unsubscribe from a conversation
            Actions.UNSUBSCRIBE_CONVERSATION -> {
                val conversationId =
                    data["conversationID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing conversationID")

                sessionManager.getSession(userID)?.subscribedConversations?.remove(conversationId)
                sendResponse(Responses.UNSUBSCRIBED_CONVERSATION, conversationId)
            }

            // send a message
            Actions.SEND_DM -> {
                val conversationId =
                    data["conversationID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing conversationID")

                val message =
                    data["message"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing message")

                // ensure proper length of message
                if (message.length > 512 || message.isEmpty()) {
                    return sendResponse(Responses.INVALID_DATA, "Message must be 1-512 characters.")
                }

                // ensure the user has permission
                val conversation = getConversation(conversationId)
                if (conversation == null || !conversation.hasUser(userID)) {
                    return sendResponse(
                        Responses.NO_PERMISSION,
                        "Cannot send to this conversation.",
                    )
                }

                val dm = createDirectMessage(conversationId, userID, message)
                broadcastToConversation(conversationId, Responses.NEW_DM, dm)
            }

            // get a conversation's history.
            Actions.GET_DM_HISTORY -> {
                val conversationID =
                    data["conversationID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing conversationID")

                val page = data["page"]?.toIntOrNull() ?: 0

                // verify user has permission
                val conversation = getConversation(conversationID)
                if (conversation == null || !conversation.hasUser(userID)) {
                    return sendResponse(Responses.NO_PERMISSION, "Cannot access this conversation.")
                }

                val history = getConversationHistory(conversationID, page)
                sendPayload(Responses.DM_HISTORY, history)
            }

            // create a topic
            Actions.CREATE_TOPIC -> {
                val name =
                    data["name"] ?: return sendResponse(Responses.INVALID_DATA, "Missing name")
                val description = data["description"] ?: ""

                if (name.length > 64 || name.isEmpty()) {
                    return sendResponse(Responses.INVALID_DATA, "Name must be 1-64 characters.")
                }

                val topic = createTopic(name, description, userID)
                sessionManager.broadcast(Responses.TOPIC_CREATED, topic) { true }
            }

            // subscribe to a topic
            Actions.SUBSCRIBE_TOPIC -> {
                val topicId =
                    data["topicID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing topicID")

                // ensure topic exists
                if (getTopic(topicId) == null) {
                    return sendResponse(Responses.INVALID_DATA, "Topic not found.")
                }

                sessionManager.getSession(userID)?.subscribedTopics?.add(topicId)
                sendResponse(Responses.SUBSCRIBED_TOPIC, topicId)
            }

            // unsubscribe from a topic
            Actions.UNSUBSCRIBE_TOPIC -> {
                val topicId =
                    data["topicID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing topicID")

                sessionManager.getSession(userID)?.subscribedTopics?.remove(topicId)
                sendResponse(Responses.UNSUBSCRIBED_TOPIC, topicId)
            }

            // send a message to a topic
            Actions.SEND_TOPIC_MESSAGE -> {
                val topicID =
                    data["topicID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing topicID")
                val message =
                    data["message"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing message")

                if (message.length > 512 || message.isEmpty()) {
                    return sendResponse(Responses.INVALID_DATA, "Message must be 1-512 characters.")
                }

                // verify topic exists
                if (getTopic(topicID) == null) {
                    return sendResponse(Responses.INVALID_DATA, "Topic not found.")
                }

                val topicMessage = createTopicMessage(topicID, userID, message)
                broadcastToTopic(topicID, Responses.NEW_TOPIC_MESSAGE, topicMessage)
            }

            // get the history of a topic
            Actions.GET_TOPIC_HISTORY -> {
                val topicId =
                    data["topicID"]
                        ?: return sendResponse(Responses.INVALID_DATA, "Missing topicID")
                val page = data["page"]?.toIntOrNull() ?: 0

                // verify topic exists
                if (getTopic(topicId) == null) {
                    return sendResponse(Responses.INVALID_DATA, "Topic not found.")
                }

                val history = getTopicHistory(topicId, page)
                sendPayload(Responses.TOPIC_HISTORY, history)
            }
        }
    }

    /** Broadcast a [payload] to all users subscribed to a [conversationID]. */
    suspend inline fun <reified T> broadcastToConversation(
        conversationID: String,
        type: Enum<*>,
        payload: T,
    ) {
        sessionManager.broadcast(type, payload) {
            it.subscribedConversations.contains(conversationID)
        }
    }

    /** Broadcast a [payload] to all users subscribed to a [topicID]. */
    suspend inline fun <reified T> broadcastToTopic(topicID: String, type: Enum<*>, payload: T) {
        sessionManager.broadcast(type, payload) { it.subscribedTopics.contains(topicID) }
    }

    /** Send a message to a specific user if they're connected. */
    suspend inline fun <reified T> sendToUser(userID: String, type: Enum<*>, payload: T) {
        sessionManager.sendToUser(userID, type, payload)
    }
}
