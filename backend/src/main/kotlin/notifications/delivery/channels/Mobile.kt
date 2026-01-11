package app.burrow.notifications.delivery.channels

import app.burrow.env
import app.burrow.notifications.delivery.Delivery
import app.burrow.notifications.delivery.DeliveryChannel
import app.burrow.notifications.delivery.deleteMobilePushSubscription
import app.burrow.notifications.delivery.getUserMobilePushSubscriptions
import com.niamedtech.expo.exposerversdk.ExpoPushNotificationClient
import com.niamedtech.expo.exposerversdk.request.PushNotification
import com.niamedtech.expo.exposerversdk.response.Status
import com.niamedtech.expo.exposerversdk.response.TicketResponse
import org.apache.hc.client5.http.impl.classic.HttpClients
import org.slf4j.LoggerFactory

/** Delivering notifications through Expo push notifications for mobile devices. */
object Mobile : DeliveryChannel {
    private val LOGGER = LoggerFactory.getLogger(this::class.java)

    /** The Expo push notification client. */
    private val expoClient: ExpoPushNotificationClient? by lazy {
        try {
            val httpClient = HttpClients.createDefault()
            val builder = ExpoPushNotificationClient.builder().setHttpClient(httpClient)

            val accessToken = env("EXPO_ACCESS_TOKEN")
            if (accessToken != null) {
                builder.setAccessToken(accessToken)
            }

            builder.build()
        } catch (e: Exception) {
            LOGGER.error("Failed to initialize Expo push notification client", e)
            null
        }
    }

    override val onDelivery: Delivery = delivery@{
        try {
            if (expoClient == null) {
                LOGGER.error(
                    "Attempted to send mobile push notification but Expo client is not active"
                )
                return@delivery false
            }

            val subscriptions = getUserMobilePushSubscriptions(userID)

            if (subscriptions.isEmpty()) {
                LOGGER.debug("No mobile push subscriptions found for user {}", userID)
                return@delivery true
            }

            var successCount = 0
            var failureCount = 0

            subscriptions.forEach { subscription ->
                try {
                    val pushNotification =
                        PushNotification().apply {
                            to = listOf(subscription.deviceToken)
                            this@apply.title = this@delivery.title
                            body = content
                            data = buildMap {
                                put("notificationId", id.toString())
                                burrowID?.let { put("burrowId", it) }
                            }
                        }

                    val tickets = expoClient!!.sendPushNotifications(listOf(pushNotification))

                    val ticket = tickets.firstOrNull()
                    if (ticket != null && ticket.status == Status.OK) {
                        successCount++
                        LOGGER.debug(
                            "Successfully sent mobile push notification to subscription {} for user {}",
                            subscription.id,
                            userID,
                        )
                    } else {
                        failureCount++
                        val errorMessage = ticket?.message ?: "Unknown error"
                        val errorType = ticket?.details?.error

                        LOGGER.warn(
                            "Failed to send mobile push notification to subscription {}: {} ({})",
                            subscription.id,
                            errorMessage,
                            errorType,
                        )

                        if (errorType == TicketResponse.Ticket.Error.DEVICE_NOT_REGISTERED) {
                            LOGGER.info("Deleting invalid mobile subscription {}", subscription.id)
                            deleteMobilePushSubscription(subscription.id)
                        }
                    }
                } catch (e: Exception) {
                    failureCount++
                    LOGGER.error(
                        "Exception sending mobile push notification to subscription {}",
                        subscription.id,
                        e,
                    )
                }
            }

            LOGGER.info(
                "Sent mobile push notification {} to user {}: {} succeeded, {} failed",
                id,
                userID,
                successCount,
                failureCount,
            )

            successCount > 0
        } catch (e: Exception) {
            LOGGER.error("Failed to send mobile push notification for {}", id, e)
            false
        }
    }
}
