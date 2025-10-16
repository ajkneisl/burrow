package app.burrow.notifications

import io.ktor.sse.ServerSentEvent
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/** Broadcast hub for notifications. */
object NotificationSessions {
    data class OutboundEvent(val sse: ServerSentEvent, val userId: String? = null)

    private val _events =
        MutableSharedFlow<OutboundEvent>(
            replay = 0,
            extraBufferCapacity = 128,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )

    val events = _events.asSharedFlow()

    /**
     * Broadcasts an event to all connected clients.
     *
     * @param data Event payload.
     */
    fun broadcast(data: String) {
        _events.tryEmit(OutboundEvent(ServerSentEvent(data = data), userId = null))
    }

    /** Target a specific user by ID. */
    fun broadcastTo(userId: String?, data: String) {
        _events.tryEmit(OutboundEvent(ServerSentEvent(data = data), userId = userId))
    }
}
