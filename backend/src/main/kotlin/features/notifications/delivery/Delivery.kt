package app.burrow.features.notifications.delivery

import app.burrow.features.notifications.Notification
import app.burrow.features.notifications.delivery.channels.Browser
import app.burrow.features.notifications.delivery.channels.Email
import app.burrow.features.notifications.delivery.channels.Mobile
import app.burrow.features.notifications.delivery.channels.Sse
import app.burrow.features.notifications.getDeliveryChannels
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
    EMAIL(0b0100, Email),
    BROWSER(0b0010, Browser),
    SSE(0b0001, Sse),
    MOBILE(0b1000, Mobile);

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

/**
 * Deliver a notification to a user through all enabled delivery channels.
 *
 * This function checks the user's notification preferences and delivers the notification through
 * all channels that the user has enabled (SSE, Email, Browser, etc.).
 *
 * @param deliveryChannels Bitmask of channels to deliver through. If null, uses user preferences.
 */
suspend fun Notification.deliver(deliveryChannels: Short? = null) {
    val channelMask = deliveryChannels ?: getDeliveryChannelsForNotification(this)

    DeliveryChannels.entries.forEach { channel ->
        if ((channelMask.toInt() and channel.id.toInt()) != 0) {
            channel.deliver(this)
        }
    }
}

/**
 * Get the delivery channel preferences for a notification.
 *
 * @param notification The notification to get preferences for.
 * @return Bitmask of enabled delivery channels.
 */
private suspend fun getDeliveryChannelsForNotification(notification: Notification): Short {
    return getDeliveryChannels(notification.userID, notification.kind)
}
