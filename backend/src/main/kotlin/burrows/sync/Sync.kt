package app.burrow.burrows.sync

import app.burrow.account.Authorization
import app.burrow.burrows.sync.block.findRegisteredBlocks
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
import io.ktor.websocket.Frame
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
                    println("removed $removedBlocks")
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
            val meetingId =
                call.parameters["id"] ?: return@webSocket call.respond(HttpStatusCode.BadRequest)
            var userId: String? = null

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
                                    userId == null) ->
                                    send(Responses.NOT_AUTHORIZED, "You are not authorized.")

                                incomingMsg.action == "AUTHORIZE" -> {
                                    val token = incomingMsg.data["token"]
                                    val authorizedUserId =
                                        runCatching { Authorization.getVerifier().verify(token) }
                                            .getOrNull()
                                            ?.subject

                                    if (authorizedUserId == null) {
                                        send(Responses.INVALID_TOKEN, "Invalid token.")
                                    } else {
                                        userId = authorizedUserId

                                        if (!userInMeeting(userId, meetingId)) {
                                            return@consumeEach send(
                                                Responses.NO_PERMISSION,
                                                "You do not have permission for this meeting..",
                                            )
                                        }

                                        join(
                                            meetingId,
                                            Session(authorizedUserId, this, getTimeMillis()),
                                        )

                                        send(
                                            Responses.WELCOME,
                                            "Welcome. There's currently ${meetings[meetingId]?.size} user(s) online.",
                                        )

                                        sendSerialized(
                                            Response(
                                                "SYNC",
                                                Responses.BLOCKS,
                                                getEnabledBlocks(meetingId),
                                            )
                                        )
                                    }
                                }

                                userId != null -> {
                                    val meetingBlocks = getMeetingBlockState(meetingId)

                                    meetingBlocks[incomingMsg.block]?.onIncoming(
                                        Block.UserBlockRequestState(
                                            userId,
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
                val joinedUserId = userId

                // if the user never actually authorized, this isn't run
                if (joinedUserId != null) {
                    leave(meetingId, joinedUserId)
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
     * Have a [session] join a [meetingId].
     *
     * @param meetingId The meeting to join.
     * @param session The session that's joining.
     */
    suspend fun join(meetingId: String, session: Session) {
        guard.withLock {
            val set = meetings.getOrPut(meetingId) { mutableSetOf() }
            set.add(session)
        }
    }

    /**
     * Have a [userId] leave a [meetingId].
     *
     * @param meetingId The meeting to leave.
     * @param userId The user who's leaving.
     */
    suspend fun leave(meetingId: String, userId: String) {
        guard.withLock {
            meetings[meetingId]?.removeIf { (chatUserID) -> chatUserID == userId }

            if (meetings[meetingId]?.isEmpty() == true) meetings.remove(meetingId)
        }
    }

    /**
     * Send a [ChatMessage] to a [meetingId].
     *
     * @param meetingId The meeting to change.
     * @param payload The message to broadcast.
     */
    suspend inline fun <reified T> broadcast(meetingId: String, payload: Response<T>) {
        val targets = meetings[meetingId]?.toList().orEmpty()
        val payloadStr = Json.encodeToString(serializer(typeOf<Response<T>>()), payload)

        for (session in targets) {
            runCatching { session.session.send(Frame.Text(payloadStr)) }
        }
    }

    /**
     * Send an [Action] to a [userId] in a [meetingId].
     *
     * @param userId The ID of the user to send the message to
     * @param meetingId The meeting to change.
     * @param payload The message to broadcast.
     */
    suspend inline fun <reified T> broadcast(
        userId: String,
        meetingId: String,
        payload: Response<T>,
    ) {
        val target =
            meetings[meetingId]?.toList().orEmpty().singleOrNull { session ->
                session.userID == userId
            }

        val payloadStr = Json.encodeToString(serializer(typeOf<Response<T>>()), payload)

        if (target != null) runCatching { target.session.send(Frame.Text(payloadStr)) }
    }
}
