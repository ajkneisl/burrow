package app.burrow.notifications.delivery.channels

import app.burrow.env
import app.burrow.notifications.delivery.Delivery
import app.burrow.notifications.delivery.DeliveryChannel
import app.burrow.notifications.delivery.deletePushSubscription
import app.burrow.notifications.delivery.getUserPushSubscriptions
import java.security.Security
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import nl.martijndwars.webpush.PushService
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.slf4j.LoggerFactory

/** Delivering notifications through a browser using Web Push. */
object Browser : DeliveryChannel {
    private val LOGGER = LoggerFactory.getLogger(this::class.java)

    init {
        Security.addProvider(BouncyCastleProvider())
    }

    /** The VAPID public key for web push. */
    val vapidPublicKey: String? by lazy { env("VAPID_PUBLIC_KEY") }

    /** The VAPID private key for web push. */
    private val vapidPrivateKey: String? by lazy { env("VAPID_PRIVATE_KEY") }

    /** The subject for VAPID (mailto: or https:// URL). */
    private val vapidSubject: String by lazy {
        env("VAPID_SUBJECT") ?: "mailto:noreply@umn.app"
    }

    /** The push service instance. */
    private val pushService: PushService? by lazy {
        val publicKey = vapidPublicKey
        val privateKey = vapidPrivateKey

        if (publicKey == null || privateKey == null) {
            LOGGER.error(
                "VAPID keys not configured. Browser notifications will not be sent. " +
                    "Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables."
            )
            return@lazy null
        }

        try {
            PushService().apply {
                setPublicKey(publicKey)
                setPrivateKey(privateKey)
                subject = vapidSubject
            }
        } catch (e: Exception) {
            LOGGER.error("Failed to initialize push service", e)
            null
        }
    }

    /**
     * The notification payload sent to the browser.
     *
     * @param title The notification title.
     * @param body The notification body.
     * @param icon The notification icon URL.
     * @param burrowId The burrow ID if applicable.
     */
    @Serializable
    private data class PushPayload(
        val title: String,
        val body: String,
        val icon: String? = null,
        val burrowId: String? = null,
    )

    override val onDelivery: Delivery = delivery@{
        try {
            if (pushService == null) {
                LOGGER.error("Attempted to send push notification but push service is not active")
                return@delivery false
            }

            // Get all push subscriptions for this user
            val subscriptions = getUserPushSubscriptions(userID)

            if (subscriptions.isEmpty()) {
                LOGGER.debug("No push subscriptions found for user {}", userID)
                return@delivery true // Not an error - user just doesn't have subscriptions
            }

            val payload =
                PushPayload(title = title, body = content, icon = getIconUrl(), burrowId = burrowID)

            val payloadJson = Json.encodeToString(payload)
            var successCount = 0
            var failureCount = 0

            // Send to all subscriptions
            subscriptions.forEach { subscription ->
                try {
                    val webPushSubscription =
                        nl.martijndwars.webpush.Subscription(
                            subscription.endpoint,
                            nl.martijndwars.webpush.Subscription.Keys(
                                subscription.p256dh,
                                subscription.auth,
                            ),
                        )

                    val notification =
                        nl.martijndwars.webpush.Notification(webPushSubscription, payloadJson)

                    val response = pushService!!.send(notification)
                    val statusCode = response.statusLine.statusCode

                    if (statusCode in 200..299) {
                        successCount++
                        LOGGER.debug(
                            "Successfully sent push notification to subscription {} for user {}",
                            subscription.id,
                            userID,
                        )
                    } else {
                        failureCount++
                        LOGGER.warn(
                            "Failed to send push notification to subscription {}: HTTP {}",
                            subscription.id,
                            statusCode,
                        )

                        // If the subscription is no longer valid (410 Gone), delete it
                        if (statusCode == 410) {
                            LOGGER.info("Deleting expired subscription {}", subscription.id)
                            deletePushSubscription(subscription.id)
                        }
                    }
                } catch (e: Exception) {
                    failureCount++
                    LOGGER.error(
                        "Exception sending push notification to subscription {}",
                        subscription.id,
                        e,
                    )
                }
            }

            LOGGER.info(
                "Sent push notification {} to user {}: {} succeeded, {} failed",
                id,
                userID,
                successCount,
                failureCount,
            )

            // Consider it a success if at least one succeeded
            successCount > 0
        } catch (e: Exception) {
            LOGGER.error("Failed to send browser push notification for {}", id, e)
            false
        }
    }

    /** Get the icon URL for notifications. */
    private fun getIconUrl(): String {
        val baseUrl = env("BASE_URL") ?: "http://localhost:5173"
        return "$baseUrl/image/burrow.png"
    }
}
