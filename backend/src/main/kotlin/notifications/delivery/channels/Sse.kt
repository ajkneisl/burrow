package app.burrow.notifications.delivery.channels

import app.burrow.account.Authorization
import app.burrow.notifications.delivery.Delivery
import app.burrow.notifications.delivery.DeliveryChannel
import io.ktor.server.routing.Route
import io.ktor.server.sse.heartbeat
import io.ktor.server.sse.sse
import io.ktor.sse.ServerSentEvent
import java.util.concurrent.atomic.AtomicInteger
import kotlin.text.trim
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.json.Json

/** Delivering notifications through ServerSideEvents */
object Sse : DeliveryChannel {
    val userCount = AtomicInteger(0)

    data class OutboundEvent(val sse: ServerSentEvent, val userId: String? = null)

    private val _events =
        MutableSharedFlow<OutboundEvent>(
            replay = 0,
            extraBufferCapacity = 128,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )

    val events = _events.asSharedFlow()

    /**
     * SSE /notifications/live
     *
     * Server-Side Events for notifications.¬
     */
    val ROUTE: Route.() -> Unit = {
        sse {
            val authorizationToken = call.request.cookies["auth"]?.trim() ?: return@sse
            val userId =
                runCatching { Authorization.getVerifier().verify(authorizationToken).subject }
                    .getOrNull() ?: return@sse

            userCount.incrementAndGet()

            try {
                heartbeat {
                    period = 15.seconds
                    event = ServerSentEvent("heartbeat", event = "heartbeat")
                }

                events.collect { evt ->
                    if (evt.userId == null || evt.userId == userId) {
                        send(evt.sse)
                    }
                }
            } finally {
                userCount.decrementAndGet()
            }
        }
    }

    /** Target a specific user by ID. */
    fun broadcastTo(userId: String?, data: String): Boolean {
        return _events.tryEmit(OutboundEvent(ServerSentEvent(data = data), userId = userId))
    }

    override val onDelivery: Delivery = {
        val notificationJson = Json.encodeToString(this)

        broadcastTo(userID, notificationJson)
    }
}
