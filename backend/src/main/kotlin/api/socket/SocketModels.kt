package app.burrow.api.socket

import kotlinx.serialization.Serializable

/**
 * An incoming WebSocket message.
 *
 * @param action The action the incoming message is taking.
 * @param data The data alongside the [action].
 * @param block Optional block identifier (used by Sync for block routing).
 */
@Serializable
data class SocketIncoming(
    val action: String,
    val data: HashMap<String, String> = hashMapOf(),
    val block: String? = null,
)

/**
 * A WebSocket response.
 *
 * @param type The type of response.
 * @param payload The response data.
 * @param block Optional block identifier (used by Sync for block routing).
 */
@Serializable
data class SocketResponse<T>(
    val type: String,
    val payload: T,
    val block: String? = null,
)
