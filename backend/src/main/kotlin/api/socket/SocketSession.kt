package app.burrow.api.socket

import io.ktor.server.websocket.WebSocketServerSession

/**
 * Base interface for a WebSocket session.
 *
 * @property userID The user in the session.
 * @property session The actual WebSocket session.
 * @property joinedAt When the user initially connected.
 */
interface SocketSession {
    val userID: String
    val session: WebSocketServerSession
    val joinedAt: Long
}

/**
 * A basic implementation of [SocketSession].
 *
 * @param userID The user in the session.
 * @param session The actual WebSocket session.
 * @param joinedAt When the user initially connected.
 */
data class BasicSocketSession(
    override val userID: String,
    override val session: WebSocketServerSession,
    override val joinedAt: Long,
) : SocketSession
