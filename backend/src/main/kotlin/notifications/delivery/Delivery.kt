package app.burrow.notifications.delivery

import app.burrow.notifications.Notification
import app.burrow.notifications.delivery.channels.Browser
import app.burrow.notifications.delivery.channels.Sse
import kotlin.time.measureTimedValue
import org.slf4j.LoggerFactory

/**
 * Delivering a notification.
 *
 * @return If the delivery was a success.
 */
typealias Delivery = suspend Notification.() -> Boolean

/** A delivery channel for a notification. */
interface DeliveryChannel {
    val onDelivery: Delivery
}

/**
 * Different channels to send notifications.
 *
 * @param id The ID of the delivery.
 * @param instance The delivery channel.
 */
enum class DeliveryChannels(val id: Short, val instance: DeliveryChannel) {
    BROWSER(0b0010, Browser),
    SSE(0b0001, Sse);

    companion object {
        private val LOGGER = LoggerFactory.getLogger(this::class.java)
    }

    /**
     * Deliver a [notification] through a channel. Records the time it took and if it was
     * successful.
     */
    suspend fun deliver(notification: Notification) {
        val (value, duration) = measureTimedValue { instance.onDelivery(notification) }

        LOGGER.debug(
            "{} delivered {} through {} (took {}s)",
            if (value) "Successfully" else "Unsuccessfully",
            notification.id,
            this.name,
            duration.inWholeSeconds,
        )
    }
}

/** Deliver a notification to a user. */
suspend fun Notification.deliver() {
    DeliveryChannels.SSE.deliver(this)
}
