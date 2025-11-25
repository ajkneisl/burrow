package app.burrow.socket

import io.ktor.server.routing.Route
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.coroutines.channels.consumeEach

/** Standard authentication responses for an authenticated websocket. */
enum class AuthResponses {
    NOT_AUTHORIZED,
    ALREADY_CONNECTED,
    INVALID_TOKEN,
    INVALID_ACTION,
    WELCOME,
}

/**
 * Configuration for an authenticated WebSocket endpoint.
 *
 * @param A The enum type for actions.
 */
class AuthenticatedWebSocketConfig<A : Enum<A>> {
    /** The action enum value that represents authorization. */
    var authorizeAction: A? = null

    /** Called to check if a user has permission. Returns error message or null if allowed. */
    var onAuthorize: (suspend WebSocketServerSession.(userID: String) -> String?)? = null

    /** Called when authorization succeeds. */
    var onConnect: (suspend WebSocketServerSession.(userID: String) -> Unit)? = null

    /** Called after successful connection to send welcome data. */
    var onWelcome: (suspend WebSocketServerSession.(userID: String) -> Unit)? = null

    /** Called when the user disconnects. */
    var onDisconnect: (suspend (userID: String) -> Unit)? = null

    /** Called to check if a user is already connected. Return true to reject the connection. */
    var isAlreadyConnected: ((userID: String) -> Boolean)? = null

    /**
     * The handler for incoming actions after authentication. Block is null for non-block-routed
     * websockets.
     */
    var onAction:
        (suspend WebSocketServerSession.(
            userID: String, action: A, data: HashMap<String, String>, block: String?,
        ) -> Unit)? =
        null
}

/**
 * Create an authenticated websocket that handles incoming actions.
 *
 * @param path The WebSocket path.
 * @param actionClass The enum class for actions.
 * @param config Configuration lambda for the WebSocket behavior.
 */
inline fun <reified A : Enum<A>> Route.authenticatedWebSocket(
    path: String,
    actionClass: Class<A>,
    crossinline config: AuthenticatedWebSocketConfig<A>.() -> Unit,
) {
    val cfg = AuthenticatedWebSocketConfig<A>().apply(config)
    val authorizeActionName = cfg.authorizeAction?.name ?: "AUTHORIZE"

    webSocket(path) {
        var userID: String? = null

        try {
            incoming.consumeEach { frame ->
                if (frame is Frame.Text) {
                    val text = frame.readText()
                    val incomingMsg = SocketUtils.parseIncoming(text)

                    if (incomingMsg != null) {
                        when {
                            // not authorized and not attempting to authorize
                            (incomingMsg.action != authorizeActionName && userID == null) -> {
                                sendResponse(
                                    AuthResponses.NOT_AUTHORIZED,
                                    "You are not authorized.",
                                )
                            }

                            // attempting to authorize
                            incomingMsg.action == authorizeActionName -> {
                                val token = incomingMsg.data["token"]
                                val authorizedUserID = SocketUtils.verifyToken(token)

                                if (authorizedUserID == null) {
                                    sendResponse(AuthResponses.INVALID_TOKEN, "Invalid token.")
                                } else {
                                    // check permission
                                    val permissionError =
                                        cfg.onAuthorize?.invoke(this, authorizedUserID)
                                    if (permissionError != null) {
                                        return@consumeEach sendResponse(
                                            AuthResponses.NOT_AUTHORIZED,
                                            permissionError,
                                        )
                                    }

                                    // check if already connected
                                    if (cfg.isAlreadyConnected?.invoke(authorizedUserID) == true) {
                                        cfg.onDisconnect?.invoke(authorizedUserID) // leave and close previous session
                                    }

                                    userID = authorizedUserID
                                    cfg.onConnect?.invoke(this, authorizedUserID)
                                    sendResponse(AuthResponses.WELCOME, "Connected.")
                                    cfg.onWelcome?.invoke(this, authorizedUserID)
                                }
                            }

                            // handle incoming action
                            userID != null -> {
                                val action =
                                    runCatching {
                                            java.lang.Enum.valueOf(actionClass, incomingMsg.action)
                                        }
                                        .getOrNull()

                                if (action == null) {
                                    sendResponse(
                                        AuthResponses.INVALID_ACTION,
                                        "Unknown action: ${incomingMsg.action}",
                                    )
                                } else {
                                    cfg.onAction?.invoke(
                                        this,
                                        userID,
                                        action,
                                        incomingMsg.data,
                                        incomingMsg.block,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        } finally {
            val joinedUserId = userID

            if (joinedUserId != null) {
                cfg.onDisconnect?.invoke(joinedUserId)
            }
        }
    }
}

/** Create an authenticated web socket. */
inline fun <reified A : Enum<A>> Route.authenticatedWebSocket(
    path: String,
    crossinline config: AuthenticatedWebSocketConfig<A>.() -> Unit,
) {
    authenticatedWebSocket(path, A::class.java, config)
}
