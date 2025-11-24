package app.burrow.socket

import app.burrow.account.Authorization
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import java.util.concurrent.ConcurrentHashMap
import kotlin.reflect.typeOf
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer

/**
 * Utility functions for WebSocket operations.
 */
object SocketUtils {
    /**
     * Verify a JWT token and return the user ID.
     *
     * @param token The JWT token to verify.
     * @return The user ID if valid, null otherwise.
     */
    fun verifyToken(token: String?): String? =
        runCatching { Authorization.getVerifier().verify(token) }
            .getOrNull()
            ?.subject

    /**
     * Parse an incoming WebSocket message.
     *
     * @param text The raw text from the WebSocket frame.
     * @return The parsed [SocketIncoming] or null if parsing failed.
     */
    fun parseIncoming(text: String): SocketIncoming? =
        runCatching { Json.decodeFromString<SocketIncoming>(text) }.getOrNull()
}

/**
 * Extension function to send a simple response to a WebSocket session.
 *
 * @param type The response type.
 * @param message The message payload.
 * @param block Optional block identifier.
 */
suspend fun WebSocketServerSession.sendResponse(type: Enum<*>, message: String, block: String? = null) {
    val response = SocketResponse(type.name, message, block)
    val payloadStr = Json.encodeToString(serializer(typeOf<SocketResponse<String>>()), response)
    send(Frame.Text(payloadStr))
}

/**
 * Extension function to send a typed payload response to a WebSocket session.
 *
 * @param type The response type.
 * @param payload The payload data.
 * @param block Optional block identifier.
 */
suspend inline fun <reified T> WebSocketServerSession.sendPayload(
    type: Enum<*>,
    payload: T,
    block: String? = null,
) {
    val response = SocketResponse(type.name, payload, block)
    val payloadStr = Json.encodeToString(serializer(typeOf<SocketResponse<T>>()), response)
    send(Frame.Text(payloadStr))
}

/**
 * Manages WebSocket sessions keyed by user ID.
 *
 * This is suitable for scenarios where each user has a single global session (like ChatSync).
 *
 * @param S The session type, must implement [SocketSession].
 */
open class UserSessionManager<S : SocketSession> {
    /** Active sessions keyed by user ID. */
    val sessions: ConcurrentHashMap<String, S> = ConcurrentHashMap()
    private val guard = Mutex()

    /**
     * Add a session.
     *
     * @param session The session to add.
     * @return true if added, false if user already has a session.
     */
    suspend fun join(session: S): Boolean {
        if (sessions.containsKey(session.userID)) return false
        guard.withLock { sessions[session.userID] = session }
        return true
    }

    /**
     * Remove a user's session.
     *
     * @param userID The user ID to remove.
     * @param closeSession Whether to close the WebSocket connection.
     */
    suspend fun leave(userID: String, closeSession: Boolean = false) {
        guard.withLock {
            if (closeSession) {
                sessions[userID]?.session?.close(CloseReason(CloseReason.Codes.NORMAL, "Disconnected"))
            }
            sessions.remove(userID)
        }
    }

    /**
     * Get a session by user ID.
     *
     * @param userID The user ID to look up.
     * @return The session or null if not found.
     */
    fun getSession(userID: String): S? = sessions[userID]

    /**
     * Check if a user has an active session.
     *
     * @param userID The user ID to check.
     * @return true if the user has an active session.
     */
    fun hasSession(userID: String): Boolean = sessions.containsKey(userID)

    /**
     * Send a payload to a specific user.
     *
     * @param userID The user ID to send to.
     * @param type The response type.
     * @param payload The payload data.
     * @param block Optional block identifier.
     */
    suspend inline fun <reified T> sendToUser(
        userID: String,
        type: Enum<*>,
        payload: T,
        block: String? = null,
    ) {
        val session = sessions[userID] ?: return
        val response = SocketResponse(type.name, payload, block)
        val payloadStr = Json.encodeToString(serializer(typeOf<SocketResponse<T>>()), response)
        runCatching { session.session.send(Frame.Text(payloadStr)) }
    }

    /**
     * Broadcast a payload to sessions matching a predicate.
     *
     * @param type The response type.
     * @param payload The payload data.
     * @param block Optional block identifier.
     * @param predicate Filter for which sessions to send to.
     */
    suspend inline fun <reified T> broadcast(
        type: Enum<*>,
        payload: T,
        block: String? = null,
        predicate: (S) -> Boolean,
    ) {
        val response = SocketResponse(type.name, payload, block)
        val payloadStr = Json.encodeToString(serializer(typeOf<SocketResponse<T>>()), response)

        sessions.values
            .filter(predicate)
            .forEach { session -> runCatching { session.session.send(Frame.Text(payloadStr)) } }
    }
}

/**
 * Manages WebSocket sessions keyed by a group ID (like meeting/room) with multiple users per group.
 *
 * This is suitable for scenarios like Sync where users join meetings.
 *
 * @param S The session type, must implement [SocketSession].
 */
open class GroupSessionManager<S : SocketSession> {
    /** Sessions organized by group ID -> set of sessions. */
    val groups: ConcurrentHashMap<String, MutableSet<S>> = ConcurrentHashMap()
    private val guard = Mutex()

    /**
     * Add a session to a group.
     *
     * @param groupID The group to join.
     * @param session The session joining.
     * @return true if added, false if user already in this group.
     */
    suspend fun join(groupID: String, session: S): Boolean {
        val alreadyInGroup = groups[groupID]?.any { it.userID == session.userID }
        if (alreadyInGroup == true) return false

        guard.withLock {
            val set = groups.getOrPut(groupID) { mutableSetOf() }
            set.add(session)
        }
        return true
    }

    /**
     * Remove a user from a group.
     *
     * @param groupID The group to leave.
     * @param userID The user leaving.
     * @param closeSession Whether to close the WebSocket connection.
     */
    suspend fun leave(groupID: String, userID: String, closeSession: Boolean = false) {
        guard.withLock {
            if (closeSession) {
                groups[groupID]
                    ?.find { it.userID == userID }
                    ?.session
                    ?.close(CloseReason(CloseReason.Codes.NORMAL, "Left group"))
            }
            groups[groupID]?.removeIf { it.userID == userID }
            if (groups[groupID]?.isEmpty() == true) groups.remove(groupID)
        }
    }

    /**
     * Get all sessions in a group.
     *
     * @param groupID The group ID.
     * @return List of sessions in the group.
     */
    fun getGroupSessions(groupID: String): List<S> = groups[groupID]?.toList().orEmpty()

    /**
     * Get the count of users in a group.
     *
     * @param groupID The group ID.
     * @return Number of users in the group.
     */
    fun getGroupSize(groupID: String): Int = groups[groupID]?.size ?: 0

    /**
     * Broadcast a payload to all users in a group.
     *
     * @param groupID The group to broadcast to.
     * @param type The response type.
     * @param payload The payload data.
     * @param block Optional block identifier.
     */
    suspend inline fun <reified T> broadcast(
        groupID: String,
        type: Enum<*>,
        payload: T,
        block: String? = null,
    ) {
        val targets = groups[groupID]?.toList().orEmpty()
        val response = SocketResponse(type.name, payload, block)
        val payloadStr = Json.encodeToString(serializer(typeOf<SocketResponse<T>>()), response)

        for (session in targets) {
            runCatching { session.session.send(Frame.Text(payloadStr)) }
        }
    }

    /**
     * Send a payload to a specific user in a group.
     *
     * @param groupID The group ID.
     * @param userID The user ID.
     * @param type The response type.
     * @param payload The payload data.
     * @param block Optional block identifier.
     */
    suspend inline fun <reified T> sendToUser(
        groupID: String,
        userID: String,
        type: Enum<*>,
        payload: T,
        block: String? = null,
    ) {
        val target = groups[groupID]?.find { it.userID == userID } ?: return
        val response = SocketResponse(type.name, payload, block)
        val payloadStr = Json.encodeToString(serializer(typeOf<SocketResponse<T>>()), response)
        runCatching { target.session.send(Frame.Text(payloadStr)) }
    }
}
