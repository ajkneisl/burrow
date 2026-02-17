package app.burrow.features.notifications

import app.burrow.MappedTable
import app.burrow.features.account.Users
import app.burrow.features.account.settings.Settings
import app.burrow.features.notifications.delivery.DeliveryChannels
import app.burrow.query
import app.burrow.toEntity
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** The kind of notification. */
enum class NotificationKind {
    UPCOMING_MEETING,
    NEW_MEETING,
    MEETING_MESSAGE,
    INVITE_RECEIVED,
    NEWSLETTER,
    RECOMMENDED,
}

/** Per-notification-type overrides for a user. */
object NotificationPreferences : Table("notification_preferences") {
    /** The owner of the preferences. */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

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
     * @see DeliveryChannels
     */
    val deliveryChannels = short("delivery_mask").nullable()

    override val primaryKey = PrimaryKey(userID, kind)

    init {
        index(false, userID)
        index(false, kind)
    }
}

/**
 * Data class representing a user's notification preferences for a specific notification kind.
 *
 * @param userID The user's ID.
 * @param kind The type of notification.
 * @param enabled Whether this notification type is enabled (null means inherit from global
 *   setting).
 * @param leadMinutes For UPCOMING_MEETING notifications, how many minutes before to notify.
 * @param throttleMinutes For MEETING_MESSAGE notifications, minimum time between notifications.
 * @param deliveryChannels Bitmask of delivery channels (null means use default).
 */
@Serializable
@MappedTable(NotificationPreferences::class)
data class NotificationPreference(
    val userID: String,
    val kind: NotificationKind,
    val enabled: Boolean? = null,
    val leadMinutes: Short? = null,
    val throttleMinutes: Short? = null,
    val deliveryChannels: Short? = null,
) {
    /**
     * Get the list of delivery channel enums from the bitmask.
     *
     * @return List of enabled delivery channels.
     */
    fun getDeliveryChannelsList(): List<DeliveryChannels> {
        val mask = deliveryChannels ?: DEFAULT_NOTIFICATION_DELIVERY
        return DeliveryChannels.entries.filter { (mask.toInt() and it.id.toInt()) != 0 }
    }

    /**
     * Check if a specific delivery channel is enabled.
     *
     * @param channel The delivery channel to check.
     * @return True if the channel is enabled.
     */
    fun isChannelEnabled(channel: DeliveryChannels): Boolean {
        val mask = deliveryChannels ?: DEFAULT_NOTIFICATION_DELIVERY
        return (mask.toInt() and channel.id.toInt()) != 0
    }
}

/**
 * Get all notification preferences for a specific user.
 *
 * @param userID The user's ID.
 * @return List of notification preferences for all configured notification kinds.
 */
suspend fun getNotificationPreferencesForUser(userID: String): List<NotificationPreference> {
    return query {
        NotificationPreferences.selectAll()
            .where { NotificationPreferences.userID eq userID }
            .toList()
            .map { row -> row.toEntity(NotificationPreferences) }
    }
}

/**
 * Get a user's notification preference for a specific notification kind.
 *
 * Returns null if no preference is set for this kind (meaning defaults should be used).
 *
 * @param userID The user's ID.
 * @param kind The notification kind.
 * @return The notification preference, or null if not found.
 */
suspend fun getNotificationPreference(
    userID: String,
    kind: NotificationKind,
): NotificationPreference? {
    return query {
        NotificationPreferences.selectAll()
            .where {
                (NotificationPreferences.userID eq userID) and
                    (NotificationPreferences.kind eq kind)
            }
            .limit(1)
            .firstOrNull()
            ?.toEntity(NotificationPreferences)
    }
}

/**
 * Set or update a user's notification preference for a specific notification kind.
 *
 * @param preference The notification preference to set.
 */
suspend fun setNotificationPreference(preference: NotificationPreference) {
    query {
        val existing =
            NotificationPreferences.selectAll()
                .where {
                    (NotificationPreferences.userID eq preference.userID) and
                        (NotificationPreferences.kind eq preference.kind)
                }
                .limit(1)
                .firstOrNull()

        if (existing != null) {
            // Update existing preference
            NotificationPreferences.update({
                (NotificationPreferences.userID eq preference.userID) and
                    (NotificationPreferences.kind eq preference.kind)
            }) {
                it[NotificationPreferences.enabled] = preference.enabled
                it[NotificationPreferences.leadMinutes] = preference.leadMinutes
                it[NotificationPreferences.throttleMinutes] = preference.throttleMinutes
                it[NotificationPreferences.deliveryChannels] = preference.deliveryChannels
            }
        } else {
            // Insert new preference
            NotificationPreferences.insert {
                it[NotificationPreferences.userID] = preference.userID
                it[NotificationPreferences.kind] = preference.kind
                it[NotificationPreferences.enabled] = preference.enabled
                it[NotificationPreferences.leadMinutes] = preference.leadMinutes
                it[NotificationPreferences.throttleMinutes] = preference.throttleMinutes
                it[NotificationPreferences.deliveryChannels] = preference.deliveryChannels
            }
        }
    }
}

/**
 * Get the effective notification settings for a user and notification kind, taking into account
 * both per-kind preferences and global settings.
 *
 * @param userID The user's ID.
 * @param kind The notification kind.
 * @return Triple of (enabled, leadMinutes, deliveryChannelMask).
 */
suspend fun getEffectiveNotificationSettings(
    userID: String,
    kind: NotificationKind,
): Triple<Boolean, Short, Short> {
    return query {
        // Get global notification setting
        val globalEnabled =
            Settings.select(Settings.notificationsEnabled)
                .where { Settings.userID eq userID }
                .limit(1)
                .firstOrNull()
                ?.get(Settings.notificationsEnabled) ?: true

        // Get user's default delivery channels
        val defaultDelivery =
            Settings.select(Settings.defaultNotificationDelivery)
                .where { Settings.userID eq userID }
                .limit(1)
                .firstOrNull()
                ?.get(Settings.defaultNotificationDelivery) ?: DEFAULT_NOTIFICATION_DELIVERY

        // Get specific kind preferences
        val kindPreferences =
            NotificationPreferences.selectAll()
                .where {
                    (NotificationPreferences.userID eq userID) and
                        (NotificationPreferences.kind eq kind)
                }
                .limit(1)
                .firstOrNull()

        // Determine if enabled (kind preference > global setting)
        val enabled = kindPreferences?.get(NotificationPreferences.enabled) ?: globalEnabled

        // Determine delivery channels (kind preference > user default > system default)
        val deliveryChannels: Short =
            kindPreferences?.get(NotificationPreferences.deliveryChannels) ?: defaultDelivery

        // Determine lead time (only for UPCOMING_MEETING)
        val lead: Short =
            when (kind) {
                NotificationKind.UPCOMING_MEETING ->
                    kindPreferences?.get(NotificationPreferences.leadMinutes)
                        ?: DEFAULT_NOTIFICATION_LEAD
                else -> 0
            }

        Triple(enabled, lead, deliveryChannels)
    }
}

/**
 * Delete a specific notification preference for a user.
 *
 * After deletion, the user will fall back to global/default settings for this notification kind.
 *
 * @param userID The user's ID.
 * @param kind The notification kind to delete.
 */
suspend fun deleteNotificationPreference(userID: String, kind: NotificationKind) {
    query {
        NotificationPreferences.deleteWhere {
            (NotificationPreferences.userID eq userID) and (NotificationPreferences.kind eq kind)
        }
    }
}

/**
 * Delete all notification preferences for a user.
 *
 * @param userID The user's ID.
 */
suspend fun deleteAllNotificationPreferences(userID: String) {
    query { NotificationPreferences.deleteWhere { NotificationPreferences.userID eq userID } }
}
