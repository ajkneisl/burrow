package app.burrow.notifications

import app.burrow.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** The kind of notification. */
enum class NotificationKind {
    UPCOMING_MEETING,
    NEW_MEETING,
    MEETING_MESSAGE,
    INVITE_RECEIVED,
}

/** Per-notification-type overrides for a user. */
object NotificationPreferences : Table("notification_preferences") {
    /** The owner of the preferences. */
    val userId = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /**
     * The kind of notification.
     *
     * @see NotificationKind
     */
    val kind = enumerationByName("kind", 32, NotificationKind::class)

    /**
     * If this notification [kind] is enabled.
     *
     * If this is null, inherit global.
     */
    val enabled = bool("enabled").nullable()

    /**
     * The amount of minutes this notification should occur.
     *
     * If this doesn't apply for a type, it's left null.
     *
     * @see NotificationKind.UPCOMING_MEETING
     */
    val leadMinutes = short("lead_minutes").nullable()

    /**
     * The amount of minutes in-between notifications.
     *
     * If this doesn't apply for a tpe, it's left null.
     *
     * @see NotificationKind.MEETING_MESSAGE
     */
    val throttleMinutes = short("throttle_minutes").nullable()

    /**
     * The channels to send this notification through.
     *
     * @see app.burrow.notifications.delivery.DeliveryChannels
     */
    val deliveryChannels = short("delivery_mask").nullable()

    override val primaryKey = PrimaryKey(userId, kind)

    init {
        index(false, userId)
        index(false, kind)
    }
}
