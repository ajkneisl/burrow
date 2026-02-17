package app.burrow.features.notifications.delivery

import app.burrow.env
import app.burrow.features.notifications.Notification
import org.slf4j.LoggerFactory
import kotlin.collections.iterator

private val LOGGER = LoggerFactory.getLogger("Templates")
private val notificationTemplate: String by lazy { loadTemplate("email-templates/notification.html") }

/**
 * Load a template file from resources.
 *
 * @param path The resource path to the template file.
 * @return The template content as a string.
 */
private fun loadTemplate(path: String): String {
    return try {
        val stream =
            object {}.javaClass.classLoader.getResourceAsStream(path)
                ?: throw IllegalStateException("Template not found: $path")
        stream.bufferedReader().use { it.readText() }
    } catch (e: Exception) {
        LOGGER.error("Failed to load email template: $path", e)
        throw e
    }
}

/**
 * Replace template variables with actual values.
 *
 * @param template The template string with {{variable}} placeholders.
 * @param variables Map of variable names to their values.
 * @return The template with variables replaced.
 */
private fun renderTemplate(template: String, variables: Map<String, String>): String {
    var result = template

    for ((key, value) in variables) {
        result = result.replace("{{$key}}", value)
    }

    return result
}

/**
 * Generate HTML email content for a notification.
 *
 * @param notification The notification to render as HTML.
 * @return HTML email content.
 */
fun generateNotificationEmail(notification: Notification): String {
    val actionButton =
        if (notification.burrowID != null) {
            """
            <div style="margin-top: 28px;">
                <a href="${getBaseUrl()}/burrow/${notification.burrowID}"
                   style="display: inline-block; padding: 14px 32px; background-color: #7A0019; color: #FFCC00; text-decoration: none; border-radius: 8px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 2px 4px rgba(122, 0, 25, 0.2); transition: background-color 0.2s;">
                    View Burrow
                </a>
            </div>
        """
                .trimIndent()
        } else {
            ""
        }

    val variables =
        mapOf(
            "title" to escapeHtml(notification.title),
            "content" to escapeHtml(notification.content),
            "action_button" to actionButton,
            "base_url" to getBaseUrl(),
        )

    return renderTemplate(notificationTemplate, variables)
}

/**
 * Escape HTML special characters to prevent XSS.
 *
 * @param text The text to escape.
 * @return HTML-safe text.
 */
private fun escapeHtml(text: String): String {
    return text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;")
}

/** The base URL. */
private fun getBaseUrl(): String {
    return env("BASE_URL") ?: "http://localhost:5173"
}
