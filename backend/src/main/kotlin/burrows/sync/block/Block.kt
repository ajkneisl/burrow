package app.burrow.burrows.sync.block

import app.burrow.burrows.sync.BurrowSync
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
import org.jetbrains.exposed.v1.r2dbc.upsert

/** A feature block. */
abstract class Block(val blockID: String, val burrowID: String) {
    /** An incoming request with the user's state. */
    typealias IncomingRequest = suspend UserBlockRequestState.() -> Unit

    /** When a request comes in specifically requesting this block. */
    abstract val onIncoming: IncomingRequest

    /** When a user initially comes in. */
    abstract val onWelcome: suspend UserBlockRequestState.() -> Unit

    /** The default state. */
    abstract val defaultState: HashMap<String, String>

    /**
     * The per-request request state.
     *
     * @param userID The user who sent the reuest.
     * @param action The action the user took.
     * @param data The included data the user provided.
     */
    data class UserBlockRequestState(
        val userID: String,
        val action: String,
        val data: HashMap<String, String>,
    )

    /**
     * The per-meeting saved state of a block.
     *
     * @param blockID The ID of the block.
     * @param burrowID The ID of the meeting.
     * @param data The saved data from the meeting
     */
    data class BlockState(
        val blockID: String,
        val burrowID: String,
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
                    row[BlockStates.blockID],
                    row[BlockStates.burrowID],
                    Json.decodeFromString(row[BlockStates.data]),
                )
        }
    }

    /** Get the [BlockState] from the [burrowID]. */
    suspend fun getState(): HashMap<String, String> = query {
        BlockStates.selectAll()
            .where {
                (BlockStates.blockID eq this@Block.blockID) and
                    (BlockStates.burrowID eq this@Block.burrowID)
            }
            .singleOrNull()
            ?.let { BlockState.fromRow(it) }
            ?.data ?: defaultState
    }

    /** Create the state for this [burrowID]. */
    suspend fun setState(data: HashMap<String, String>) = query {
        BlockStates.upsert(BlockStates.blockID, BlockStates.burrowID) {
            it[BlockStates.blockID] = this@Block.blockID
            it[BlockStates.burrowID] = this@Block.burrowID
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
        send(Response(this@Block.blockID, "SUCCESS", message))

    /**
     * Send a message indicating an error.
     *
     * @param message The message to describe the error.
     */
    suspend fun UserBlockRequestState.sendError(message: String) =
        send(Response(this@Block.blockID, "ERROR", message))

    /**
     * Receive a string as an Action.
     *
     * @return The string as the included enum, or null if it's invalid.
     */
    inline fun <reified T : Enum<T>> String.asAction(): T? =
        runCatching { enumValueOf<T>(this) }.getOrNull()

    /** Broadcast a [payload] to the whole meeting. */
    suspend inline fun <reified T> broadcast(payload: Response<T>) =
        BurrowSync.broadcast<T>(burrowID, payload)

    /** Broadcast a [type] enum and [payload] to the whole meeting. */
    suspend inline fun <reified T> broadcastResponse(type: Enum<*>, payload: T) =
        broadcast(Response(this@Block.blockID, type, payload))

    /** Broadcast a [type] string and [payload] to the whole meeting. */
    suspend inline fun <reified T> broadcastResponse(type: String, payload: T) =
        broadcast(Response(this@Block.blockID, type, payload))

    /** Send a [payload] and to a specific [userId]. */
    suspend inline fun <reified T> send(userId: String, payload: Response<T>) =
        BurrowSync.broadcast(userId, burrowID, payload)

    /** Send a [payload] and to a specific user, indicated within the [UserBlockRequestState]. */
    suspend inline fun <reified T> UserBlockRequestState.send(payload: Response<T>) =
        send(userID, payload)

    /**
     * Send a [type] enum and [payload] and to a specific user, indicated within the
     * [UserBlockRequestState].
     */
    suspend inline fun <reified T> UserBlockRequestState.sendResponse(type: Enum<*>, payload: T) =
        send(Response(this@Block.blockID, type, payload))

    /**
     * Send a [type] string and [payload] and to a specific user, indicated within the
     * [UserBlockRequestState].
     */
    suspend inline fun <reified T> UserBlockRequestState.sendResponse(type: String, payload: T) =
        send(Response(this@Block.blockID, type, payload))
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
            .where { (BlockStates.burrowID eq meetingId) and (BlockStates.blockID eq blockName) }
            .singleOrNull()

    if (existing == null) {
        // create instance and add to cache
        BurrowSync.addBlock(meetingId, blockName)

        BlockStates.insert {
            it[BlockStates.blockID] = blockName
            it[BlockStates.burrowID] = meetingId
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
    BurrowSync.removeBlock(meetingId, blockName)

    BlockStates.deleteWhere {
        (BlockStates.burrowID eq meetingId) and (BlockStates.blockID eq blockName)
    }
}

/**
 * Get all enabled blocks in a meeting.
 *
 * @param meetingId The ID of the meeting.
 */
suspend fun getEnabledBlocks(meetingId: String): List<String> = query {
    BlockStates.select(BlockStates.blockID)
        .where { BlockStates.burrowID eq meetingId }
        .map { it[BlockStates.blockID] }
        .toList()
}
