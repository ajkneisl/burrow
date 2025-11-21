package app.burrow.burrows.sync

import app.burrow.account.Authorization
import app.burrow.burrows.membership.isModerator
import app.burrow.burrows.membership.userInMeeting
import app.burrow.burrows.sync.block.Block
import app.burrow.burrows.sync.block.BlockStates
import app.burrow.burrows.sync.block.disableBlock
import app.burrow.burrows.sync.block.enableBlock
import app.burrow.burrows.sync.block.findRegisteredBlocks
import app.burrow.burrows.sync.block.getEnabledBlocks
import app.burrow.burrows.sync.chat.ChatMessage
import app.burrow.burrows.sync.models.Incoming
import app.burrow.burrows.sync.models.Response
import app.burrow.query
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.patch
import io.ktor.server.routing.route
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.server.websocket.sendSerialized
import io.ktor.server.websocket.webSocket
import io.ktor.util.date.getTimeMillis
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import java.util.concurrent.ConcurrentHashMap
import kotlin.collections.orEmpty
import kotlin.collections.toList
import kotlin.reflect.KClass
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.typeOf
import kotlinx.coroutines.channels.consumeEach
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * Handles features that need to be synced among groups.
 *
 * This handles primarily chats and blocks that need to be synced among the group.
 */
object Sync {
    /**
     * An individual user's session.
     *
     * @param userID The user in the session.
     * @param session The actual websocket.
     * @param joinedAt When the user initially connected.
     */
    data class Session(val userID: String, val session: WebSocketServerSession, val joinedAt: Long)

    /** The responses from [Sync]. */
    enum class Responses {
        NOT_AUTHORIZED,
        ALREADY_CONNECTED,
        NO_PERMISSION,
        INVALID_TOKEN,
        INVALID_BLOCK,
        WELCOME,
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
     * @param meetingId The ID of the meeting to clear the state for.
     * @param blockName The name of the block to remove.
     */
    fun removeBlock(meetingId: String, blockName: String) =
        MEETING_BLOCK_STATE.computeIfPresent(meetingId) { _, map ->
            map.filterKeys { block -> block != blockName }
        }

    /**
     * Add a block state to a meeting's cache.
     *
     * @param meetingId The ID of the meeting to add the instance to.
     * @param blockName The name of the block to add.
     */
    fun addBlock(meetingId: String, blockName: String) {
        val key = blockName.uppercase()
        val blockClass = BLOCKS[key] ?: return
        val blockInstance = blockClass.primaryConstructor?.call(meetingId) as? Block

        MEETING_BLOCK_STATE.compute(meetingId) { _, current ->
            val next = (current?.toMutableMap() ?: mutableMapOf())
            next[key] = blockInstance
            next
        }
    }

    /**
     * Get the [BlockStates] for a [meetingId].
     *
     * @param meetingId The ID to retrieve the block states for
     */
    suspend fun getMeetingBlockState(meetingId: String): Map<String, Block?> {
        if (MEETING_BLOCK_STATE.containsKey(meetingId)) {
            return MEETING_BLOCK_STATE[meetingId]!!
        }

        val blockStates = query {
            BlockStates.selectAll()
                .where { BlockStates.meetingId eq meetingId }
                .map { row -> Block.BlockState.fromRow(row) }
                .toList()
                .associate { block ->
                    val blockInstance =
                        (BLOCKS[block.block]?.primaryConstructor?.call(meetingId) as Block?)

                    block.block to blockInstance
                }
        }

        MEETING_BLOCK_STATE[meetingId] = blockStates

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
                    val userId =
                        call.principal<JWTPrincipal>()?.subject
                            ?: return@patch call.respond(HttpStatusCode.Unauthorized)

                    if (!(userId isModerator meetingId)) {
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
        webSocket("/sync") {
            val burrowID =
                call.parameters["id"] ?: return@webSocket call.respond(HttpStatusCode.BadRequest)
            var userID: String? = null

            suspend fun send(type: Enum<*>, message: String) {
                sendSerialized(Response("SYNC", type, message))
            }

            try {
                incoming.consumeEach { frame ->
                    if (frame is Frame.Text) {
                        val text = frame.readText()

                        // receive incoming data
                        val incomingMsg =
                            runCatching { Json.decodeFromString<Incoming>(text) }.getOrNull()

                        if (incomingMsg != null) {
                            when {
                                (incomingMsg.block != "SYNC" &&
                                    incomingMsg.action != "AUTHORIZE" &&
                                    userID == null) ->
                                    send(Responses.NOT_AUTHORIZED, "You are not authorized.")

                                incomingMsg.action == "AUTHORIZE" -> {
                                    val token = incomingMsg.data["token"]
                                    val authorizedUserID =
                                        runCatching { Authorization.getVerifier().verify(token) }
                                            .getOrNull()
                                            ?.subject

                                    if (authorizedUserID == null) {
                                        send(Responses.INVALID_TOKEN, "Invalid token.")
                                    } else {
                                        userID = authorizedUserID

                                        // make sure they have permission to be here
                                        if (!userInMeeting(userID, burrowID)) {
                                            return@consumeEach send(
                                                Responses.NO_PERMISSION,
                                                "You do not have permission for this meeting.",
                                            )
                                        }

                                        val joinResult =
                                            join(
                                                burrowID,
                                                Session(authorizedUserID, this, getTimeMillis()),
                                            )

                                        if (!joinResult) {
                                            return@consumeEach send(
                                                Responses.ALREADY_CONNECTED,
                                                "You are connected to this meeting somewhere else.",
                                            )
                                        }

                                        send(
                                            Responses.WELCOME,
                                            "Welcome. There's currently ${meetings[burrowID]?.size} user(s) online.",
                                        )

                                        sendSerialized(
                                            Response(
                                                "SYNC",
                                                Responses.BLOCKS,
                                                getEnabledBlocks(burrowID),
                                            )
                                        )
                                    }
                                }

                                userID != null -> {
                                    val meetingBlocks = getMeetingBlockState(burrowID)

                                    meetingBlocks[incomingMsg.block]?.onIncoming(
                                        Block.UserBlockRequestState(
                                            userID,
                                            incomingMsg.action,
                                            incomingMsg.data,
                                        )
                                    )
                                        ?: send(
                                            Responses.INVALID_BLOCK,
                                            "This block is not enabled in this meeting.",
                                        )
                                }
                            }
                        }
                    }
                }
            } finally {
                val joinedUserId = userID

                // if the user never actually authorized, this isn't run
                if (joinedUserId != null) {
                    leave(burrowID, joinedUserId)
                }
            }
        }
    }

    /**
     * Individual meetings and their users.
     *
     * Key: The user's meeting ID. Value: A list of all connected users.
     */
    val meetings: ConcurrentHashMap<String, MutableSet<Session>> = ConcurrentHashMap()
    private val guard = Mutex()

    /**
     * Have a [session] join a [burrowID].
     *
     * @param burrowID The Burrow to join.
     * @param session The session that's joining.
     */
    suspend fun join(burrowID: String, session: Session): Boolean {
        // check if user has an existing session
        val alreadyInMeeting =
            meetings[burrowID]?.any { existingSession -> existingSession.userID == session.userID }

        if (alreadyInMeeting == true) return false

        guard.withLock {
            val set = meetings.getOrPut(burrowID) { mutableSetOf() }
            set.add(session)
        }

        return true
    }

    /**
     * Have a [userID] leave a [burrowID].
     *
     * @param burrowID The Burrow to leave.
     * @param userID The user who's leaving.
     * @param closeSession Whether to close the WebSocket session. Defaults to false.
     */
    suspend fun leave(burrowID: String, userID: String, closeSession: Boolean = false) {
        guard.withLock {
            if (closeSession) {
                meetings[burrowID]
                    ?.find { session -> session.userID == userID }
                    ?.session
                    ?.close(CloseReason(CloseReason.Codes.NORMAL, "User left the burrow"))
            }

            meetings[burrowID]?.removeIf { (chatUserID) -> chatUserID == userID }

            if (meetings[burrowID]?.isEmpty() == true) meetings.remove(burrowID)
        }
    }

    /**
     * Send a [ChatMessage] to a [burrowID].
     *
     * @param burrowID The Burrow to change.
     * @param payload The message to broadcast.
     */
    suspend inline fun <reified T> broadcast(burrowID: String, payload: Response<T>) {
        val targets = meetings[burrowID]?.toList().orEmpty()
        val payloadStr = Json.encodeToString(serializer(typeOf<Response<T>>()), payload)

        for (session in targets) {
            runCatching { session.session.send(Frame.Text(payloadStr)) }
        }
    }

    /**
     * Send an [Action] to a [userID] in a [meetingID].
     *
     * @param userID The ID of the user to send the message to
     * @param meetingID The meeting to change.
     * @param payload The message to broadcast.
     */
    suspend inline fun <reified T> broadcast(
        userID: String,
        meetingID: String,
        payload: Response<T>,
    ) {
        val target =
            meetings[meetingID]?.toList().orEmpty().singleOrNull { session ->
                session.userID == userID
            }

        val payloadStr = Json.encodeToString(serializer(typeOf<Response<T>>()), payload)

        if (target != null) runCatching { target.session.send(Frame.Text(payloadStr)) }
    }
}
