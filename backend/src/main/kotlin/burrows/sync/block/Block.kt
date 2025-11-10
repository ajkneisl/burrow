package app.burrow.burrows.sync.block

import app.burrow.burrows.sync.Sync
import app.burrow.burrows.sync.models.Response
import app.burrow.query
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** A feature block. */
abstract class Block(val blockId: String, val meetingId: String) {
    /** An incoming request with the user's state. */
    typealias IncomingRequest = suspend UserBlockRequestState.() -> Unit

    /** When a request comes in specifically requesting this block. */
    abstract val onIncoming: IncomingRequest

    /**
     * The per-request request state.
     *
     * @param userId The user who sent the reuest.
     * @param action The action the user took.
     * @param data The included data the user provided.
     */
    data class UserBlockRequestState(
        val userId: String,
        val action: String,
        val data: HashMap<String, String>,
    )

    /**
     * The per-meeting saved state of a block.
     *
     * @param block The ID of the block.
     * @param meetingId The ID of the meeting.
     * @param data The saved data from the meeting
     */
    data class BlockState(
        val block: String,
        val meetingId: String,
        val data: HashMap<String, String>,
    ) {
        companion object {
            const val EMPTY = "{}"

            /**
             * Form a [BlockState] from a [row].
             *
             * @param row A row containing a block state.
             */
            fun fromRow(row: ResultRow): BlockState =
                BlockState(
                    row[BlockStates.block],
                    row[BlockStates.meetingId],
                    Json.decodeFromString(row[BlockStates.data]),
                )
        }
    }

    /** Get the [BlockState] from the [meetingId]. */
    suspend fun getState(): BlockState? = query {
        BlockStates.selectAll()
            .where { (BlockStates.block eq blockId) and (BlockStates.meetingId eq meetingId) }
            .singleOrNull()
            ?.let { BlockState.fromRow(it) }
    }

    /** Create the state for this [meetingId]. */
    suspend fun createState(data: HashMap<String, String>) = query {
        BlockStates.insert {
            it[BlockStates.block] = blockId
            it[BlockStates.meetingId] = meetingId
            it[BlockStates.data] = Json.encodeToString(data)
        }
    }

    /** If the user makes a request with invalid arguments. */
    suspend fun UserBlockRequestState.invalidArguments() = sendError("Invalid arguments.")

    /** If the user makes a request with invalid permissions. */
    suspend fun UserBlockRequestState.invalidPermissions() = sendError("Invalid permissions.")

    /** If the user makes a request with an invalid action. */
    suspend fun UserBlockRequestState.invalidAction() = sendError("Invalid action.")

    /**
     * Send a message indicating success.
     *
     * @param message The message to describe the success.
     */
    suspend fun UserBlockRequestState.sendSuccess(message: String) =
        send(Response(blockId, "SUCCESS", message))

    /**
     * Send a message indicating an error.
     *
     * @param message The message to describe the error.
     */
    suspend fun UserBlockRequestState.sendError(message: String) =
        send(Response(blockId, "ERROR", message))

    /**
     * Receive a string as an Action.
     *
     * @return The string as the included enum, or null if it's invalid.
     */
    inline fun <reified T : Enum<T>> String.asAction(): T? =
        runCatching { enumValueOf<T>(this) }.getOrNull()

    /** Broadcast a [payload] to the whole meeting. */
    suspend inline fun <reified T> broadcast(payload: Response<T>) =
        Sync.broadcast<T>(meetingId, payload)

    /** Broadcast a [type] enum and [payload] to the whole meeting. */
    suspend inline fun <reified T> broadcastResponse(type: Enum<*>, payload: T) =
        broadcast(Response(blockId, type, payload))

    /** Broadcast a [type] string and [payload] to the whole meeting. */
    suspend inline fun <reified T> broadcastResponse(type: String, payload: T) =
        broadcast(Response(blockId, type, payload))

    /** Send a [payload] and to a specific [userId]. */
    suspend inline fun <reified T> send(userId: String, payload: Response<T>) =
        Sync.broadcast(userId, meetingId, payload)

    /** Send a [payload] and to a specific user, indicated within the [UserBlockRequestState]. */
    suspend inline fun <reified T> UserBlockRequestState.send(payload: Response<T>) =
        send(userId, payload)

    /**
     * Send a [type] enum and [payload] and to a specific user, indicated within the
     * [UserBlockRequestState].
     */
    suspend inline fun <reified T> UserBlockRequestState.sendResponse(type: Enum<*>, payload: T) =
        send(Response(blockId, type, payload))

    /**
     * Send a [type] string and [payload] and to a specific user, indicated within the
     * [UserBlockRequestState].
     */
    suspend inline fun <reified T> UserBlockRequestState.sendResponse(type: String, payload: T) =
        send(Response(blockId, type, payload))
}

/**
 * Enable a block in a meeting.
 *
 * @param meetingId The ID of the meeting to enable the block in.
 * @param blockName The block to enable.
 */
suspend fun enableBlock(meetingId: String, blockName: String) = query {
    val existing =
        BlockStates.selectAll()
            .where { (BlockStates.meetingId eq meetingId) and (BlockStates.block eq blockName) }
            .singleOrNull()

    if (existing == null) {
        // create instance and add to cache
        Sync.addBlock(meetingId, blockName)

        BlockStates.insert {
            it[BlockStates.block] = blockName
            it[BlockStates.meetingId] = meetingId
            it[BlockStates.data] = "{}"
        }
    }
}

/**
 * Disable a block in a meeting.
 *
 * @param meetingId The ID of the meeting to disable the block in.
 * @param blockName The block to disable.
 */
suspend fun disableBlock(meetingId: String, blockName: String) = query {
    // remove instance from cache
    Sync.removeBlock(meetingId, blockName)

    BlockStates.deleteWhere {
        (BlockStates.meetingId eq meetingId) and (BlockStates.block eq blockName)
    }
}

/**
 * Get all enabled blocks in a meeting.
 *
 * @param meetingId The ID of the meeting.
 */
suspend fun getEnabledBlocks(meetingId: String): List<String> = query {
    BlockStates.select(BlockStates.block)
        .where { BlockStates.meetingId eq meetingId }
        .map { it[BlockStates.block] }
        .toList()
}
