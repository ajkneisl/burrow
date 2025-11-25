package app.burrow.burrows.sync

import app.burrow.burrows.membership.isModerator
import app.burrow.burrows.membership.userInMeeting
import app.burrow.burrows.sync.block.Block
import app.burrow.burrows.sync.block.BlockStates
import app.burrow.burrows.sync.block.disableBlock
import app.burrow.burrows.sync.block.enableBlock
import app.burrow.burrows.sync.block.findRegisteredBlocks
import app.burrow.burrows.sync.block.getEnabledBlocks
import app.burrow.burrows.sync.models.Response
import app.burrow.query
import app.burrow.socket.BasicSocketSession
import app.burrow.socket.GroupSessionManager
import app.burrow.socket.authenticatedWebSocket
import app.burrow.socket.sendResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.patch
import io.ktor.server.routing.route
import io.ktor.server.websocket.sendSerialized
import io.ktor.util.date.getTimeMillis
import io.ktor.websocket.Frame
import java.util.concurrent.ConcurrentHashMap
import kotlin.reflect.KClass
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.typeOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * Handles features that need to be synced among Burrows.
 *
 * This handles primarily chats and blocks that need to be synced among the group.
 */
object BurrowSync {
    /** Session manager for meeting sessions. */
    val sessionManager = GroupSessionManager<BasicSocketSession>()

    /**
     * Actions for the Sync websocket. Block-specific actions are handled by the blocks themselves.
     */
    enum class Actions {
        AUTHORIZE,
        EXECUTE_BLOCK,
    }

    /** The responses from [BurrowSync]. */
    enum class Responses {
        INVALID_BLOCK,
        BLOCKS,
    }

    /** All registered blocks. */
    val BLOCKS: Map<String, KClass<*>> by lazy {
        findRegisteredBlocks().associateBy { clazz -> clazz.simpleName?.uppercase()!! }
    }

    /** A cache of all blocks within a meeting. */
    private val MEETING_BLOCK_STATE = ConcurrentHashMap<String, Map<String, Block?>>()

    /**
     * Remove a block state for a meeting.
     *
     * @param burrowID The ID of the meeting to clear the state for.
     * @param blockName The name of the block to remove.
     */
    fun removeBlock(burrowID: String, blockName: String) =
        MEETING_BLOCK_STATE.computeIfPresent(burrowID) { _, map ->
            map.filterKeys { block -> block != blockName }
        }

    /**
     * Add a block state to a meeting's cache.
     *
     * @param burrowID The ID of the meeting to add the instance to.
     * @param blockName The name of the block to add.
     */
    fun addBlock(burrowID: String, blockName: String) {
        val key = blockName.uppercase()
        val blockClass = BLOCKS[key] ?: return
        val blockInstance = blockClass.primaryConstructor?.call(burrowID) as? Block

        MEETING_BLOCK_STATE.compute(burrowID) { _, current ->
            val next = (current?.toMutableMap() ?: mutableMapOf())
            next[key] = blockInstance
            next
        }
    }

    /**
     * Get the [BlockStates] for a [burrowID].
     *
     * @param burrowID The ID to retrieve the block states for
     */
    suspend fun getMeetingBlockState(burrowID: String): Map<String, Block?> {
        if (MEETING_BLOCK_STATE.containsKey(burrowID)) {
            return MEETING_BLOCK_STATE[burrowID]!!
        }

        val blockStates = query {
            BlockStates.selectAll()
                .where { BlockStates.burrowID eq burrowID }
                .map { row -> Block.BlockState.fromRow(row) }
                .toList()
                .associate { block ->
                    val blockInstance =
                        (BLOCKS[block.blockID]?.primaryConstructor?.call(burrowID) as Block?)

                    block.blockID to blockInstance
                }
        }

        MEETING_BLOCK_STATE[burrowID] = blockStates

        return blockStates
    }

    val SYNC_ROUTES: Route.() -> Unit = {
        authenticate("primary") {
            route("/block") {
                // PATCH /groups/{id}/block
                // update enabled blocks
                patch {
                    val meetingId =
                        call.parameters["id"]
                            ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val burrowID =
                        call.principal<JWTPrincipal>()?.subject
                            ?: return@patch call.respond(HttpStatusCode.Unauthorized)

                    if (!(burrowID isModerator meetingId)) {
                        return@patch call.respond(HttpStatusCode.Forbidden)
                    }

                    val newBlocks = call.receive<List<String>>().toSet()
                    val oldBlocks = getEnabledBlocks(meetingId).toSet()

                    val removedBlocks = (oldBlocks - newBlocks).toList()
                    removedBlocks.forEach { block -> disableBlock(meetingId, block) }

                    val addedBlocks = (newBlocks - oldBlocks).toList()
                    addedBlocks.forEach { block -> enableBlock(meetingId, block) }

                    call.respond(HttpStatusCode.OK)
                }
            }
        }

        // WS /groups/{id}/sync
        // sync live attributes about a specific meeting.
        authenticatedWebSocket<Actions>("/sync") {
            var burrowID: String? = null

            authorizeAction = Actions.AUTHORIZE

            onAuthorize = { userID ->
                burrowID = call.parameters["id"]

                if (burrowID == null) {
                    "Invalid meeting ID."
                } else if (!userInMeeting(userID, burrowID!!)) {
                    "You do not have permission for this meeting."
                } else {
                    null
                }
            }

            isAlreadyConnected = { userID ->
                burrowID?.let {
                    sessionManager.getGroupSessions(it).any { s -> s.userID == userID }
                } ?: false
            }

            onConnect = { userID ->
                burrowID?.let { bid ->
                    sessionManager.join(bid, BasicSocketSession(userID, this, getTimeMillis()))
                }
            }

            onWelcome = { userID ->
                burrowID?.let { burrowID ->
                    val enabledBlocks = getEnabledBlocks(burrowID)
                    sendSerialized(Response("SYNC", Responses.BLOCKS, enabledBlocks))

                    getMeetingBlockState(burrowID).forEach { (_, block) ->
                        block?.onWelcome(
                            Block.UserBlockRequestState(userID, "RECEIVE_WELCOME", hashMapOf())
                        )
                    }
                }
            }

            onDisconnect = { userID ->
                burrowID?.let { bid -> sessionManager.leave(bid, userID, true) }
            }

            onAction = { userID, _, data, block ->
                val bid = burrowID

                if (bid != null && block != null) {
                    val meetingBlocks = getMeetingBlockState(bid)
                    val actionName = data["action"]

                    if (actionName != null) {
                        meetingBlocks[block]?.onIncoming(
                            Block.UserBlockRequestState(userID, actionName, data)
                        )
                            ?: sendResponse(
                                Responses.INVALID_BLOCK,
                                "This block is not enabled in this meeting.",
                            )
                    }
                }
            }
        }
    }

    /**
     * Have a [userID] leave a [burrowID].
     *
     * @param burrowID The Burrow to leave.
     * @param userID The user who's leaving.
     * @param closeSession Whether to close the WebSocket session. Defaults to false.
     */
    suspend fun leave(burrowID: String, userID: String, closeSession: Boolean = false) {
        sessionManager.leave(burrowID, userID, closeSession)
    }

    /**
     * Broadcast a [payload] to all users in a [burrowID].
     *
     * @param burrowID The Burrow to broadcast to.
     * @param payload The message to broadcast.
     */
    suspend inline fun <reified T> broadcast(burrowID: String, payload: Response<T>) {
        val targets = sessionManager.getGroupSessions(burrowID)
        val payloadStr = Json.encodeToString(serializer(typeOf<Response<T>>()), payload)

        for (session in targets) {
            runCatching { session.session.send(Frame.Text(payloadStr)) }
        }
    }

    /**
     * Send a [payload] to a specific [userID] in a [meetingID].
     *
     * @param userID The ID of the user to send the message to
     * @param meetingID The meeting the user is in.
     * @param payload The message to send.
     */
    suspend inline fun <reified T> broadcast(
        userID: String,
        meetingID: String,
        payload: Response<T>,
    ) {
        val target = sessionManager.getGroupSessions(meetingID).find { it.userID == userID }
        val payloadStr = Json.encodeToString(serializer(typeOf<Response<T>>()), payload)

        if (target != null) runCatching { target.session.send(Frame.Text(payloadStr)) }
    }
}
