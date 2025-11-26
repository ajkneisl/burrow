package app.burrow.account.settings

import app.burrow.account.models.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** A user's settings. */
object Settings : Table("user_settings") {
    /** The user's ID. */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /**
     * The user's theme.
     *
     * By default, this is [Theme.AUTO].
     */
    val theme = enumeration<Theme>("theme").default(Theme.AUTO)

    /**
     * If the user has their notifications enabled.
     *
     * By default, this is true.
     */
    val notificationsEnabled = bool("notifications_enabled").default(true)

    /**
     * Default notification delivery.
     *
     * By default, this is through SSE and email.
     */
    val defaultNotificationDelivery = short("default_notification_delivery").default(0b0000_0011)
}
