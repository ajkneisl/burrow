package app.burrow.features.notifications.delivery.channels

import app.burrow.features.account.models.getUserByID
import app.burrow.env
import app.burrow.features.notifications.delivery.Delivery
import app.burrow.features.notifications.delivery.DeliveryChannel
import app.burrow.features.notifications.delivery.generateNotificationEmail
import org.slf4j.LoggerFactory
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.ses.SesClient
import software.amazon.awssdk.services.ses.model.Body
import software.amazon.awssdk.services.ses.model.Content
import software.amazon.awssdk.services.ses.model.Destination
import software.amazon.awssdk.services.ses.model.Message
import software.amazon.awssdk.services.ses.model.SendEmailRequest

/** Sending notifications through emails. */
object Email : DeliveryChannel {
    private val LOGGER = LoggerFactory.getLogger(this::class.java)

    init {
        Runtime.getRuntime()
            .addShutdownHook(
                Thread {
                    try {
                        sesClient?.close()
                    } catch (e: Exception) {
                        LOGGER.error("Error closing SES client", e)
                    }
                }
            )
    }

    /** The AWS client for SES. */
    private val sesClient: SesClient? by lazy {
        val region = Region.of(env("AWS_REGION") ?: "us-east-1")

        val credentialsProvider =
            try {
                EnvironmentVariableCredentialsProvider.create()
            } catch (_: Exception) {
                LOGGER.error(
                    "Failed to create AWS client. ALL notifications sent to email will fail."
                )

                return@lazy null
            }

        SesClient.builder().region(region).credentialsProvider(credentialsProvider).build()
    }

    private const val FROM = "Burrow <noreply@umn.app>"

    override val onDelivery: Delivery = delivery@{
        try {
            if (sesClient == null) {
                LOGGER.error("Attempted to send email to {} but AWS is not active.", userID)
                return@delivery false
            }

            val user = getUserByID(userID)

            val htmlBody = generateNotificationEmail(this)

            val destination = Destination.builder().toAddresses(user.email).build()
            val subject = Content.builder().data(title).charset("UTF-8").build()
            val htmlContent = Content.builder().data(htmlBody).charset("UTF-8").build()
            val body = Body.builder().html(htmlContent).build()
            val message = Message.builder().subject(subject).body(body).build()

            val emailRequest =
                SendEmailRequest.builder()
                    .source(FROM)
                    .destination(destination)
                    .message(message)
                    .build()

            val response = sesClient!!.sendEmail(emailRequest)

            LOGGER.info(
                "Email sent successfully to ${user.email} (notification ${id}). Message ID: ${response.messageId()}"
            )

            true
        } catch (e: Exception) {
            LOGGER.error("Failed to send email for notification $id", e)
            false
        }
    }
}
