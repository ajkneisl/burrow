package app.burrow.notifications

import app.burrow.account.Users
import app.burrow.groups.sync.chat.ChatMessage
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.not
import org.jetbrains.exposed.v1.r2dbc.batchInsert
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * A notification for a user.
 *
 * @param id The ID of the notification.
 * @param userId The ID of the user.
 * @param title The title of the notification.
 * @param content The body of the notification.
 * @param date When the notification was created.
 * @param read If the user has read this notification.
 */
@Serializable
data class Notification(
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val id: UUID,
    val userId: String,
    val title: String,
    val content: String,
    val sentDate: Long,
    val scheduledDate: Long?,
    val read: Boolean,
) {
    companion object {
        /** Create a [Notification] from a [row]. */
        fun fromRow(row: ResultRow): Notification =
            Notification(
                row[Notifications.id],
                row[Notifications.userId],
                row[Notifications.title],
                row[Notifications.content],
                row[Notifications.sentDate],
                row[Notifications.scheduledDate],
                row[Notifications.read],
            )
    }
}

/**
 * Get a user's notifications.
 *
 * @param userId The user to retrieve the notifications for.
 */
suspend fun getNotifications(userId: String): List<Notification> = query {
    Notifications.selectAll()
        .where { Notifications.userId eq userId }
        .orderBy(Notifications.sentDate, SortOrder.DESC)
        .map { Notification.fromRow(it) }
        .toList()
}

/**
 * Delete a notification by its ID.
 *
 * @param userId The owner of the notification.
 * @param notificationId The ID of the notification.
 */
suspend fun deleteNotification(userId: String, notificationId: UUID) = query {
    Notifications.deleteWhere {
        (Notifications.id eq notificationId) and (Notifications.userId eq userId)
    }
}

/**
 * Delete all of a user's notifications.
 *
 * @param userId The user to delete the notifications for.
 */
suspend fun deleteAllNotifications(userId: String) = query {
    Notifications.deleteWhere { Notifications.userId eq userId }
}

/**
 * Create a single notification for a user.
 *
 * @param title The title of the notification.
 * @param content The content of the notification.
 * @param userId The ID of the user to receive the notification.
 */
suspend fun createNotification(title: String, content: String, userId: String) {
    val uuid = UUID.randomUUID()
    val currentTime = getTimeMillis()

    val obj = Notification(uuid, userId, title, content, currentTime, currentTime, false)
    val serializedObj = Json.encodeToString(obj)

    query {
        Notifications.insert {
            it[Notifications.id] = uuid
            it[Notifications.userId] = userId
            it[Notifications.title] = title
            it[Notifications.content] = content
            it[Notifications.scheduledDate] = currentTime
            it[Notifications.sentDate] = currentTime
            it[Notifications.read] = false
        }
    }

    NotificationSessions.broadcastTo(userId, serializedObj)
}

/**
 * Create a notification for all users.
 *
 * @param title The title of the notification.
 * @param content The content of the notification.
 */
suspend fun createUniversalNotification(title: String, content: String) {
    // TODO: is this fucked
    val allUser = query { Users.select(Users.googleID).toList().map { it[Users.googleID] } }

    val currentTime = getTimeMillis()

    query {
        Notifications.batchInsert(allUser) { userId ->
            val uuid = UUID.randomUUID()

            this[Notifications.id] = uuid
            this[Notifications.userId] = userId
            this[Notifications.title] = title
            this[Notifications.content] = content
            this[Notifications.sentDate] = currentTime
            this[Notifications.read] = false

            val obj = Notification(uuid, userId, title, content, currentTime, 0, false)

            userId send obj
        }
    }
}

/**
 * Send a notification to a user.
 *
 * @param notification The notification to send.
 * @param this The user to send it to.
 */
infix fun String.send(notification: Notification) {
    val serializedObj = Json.encodeToString(notification)
    NotificationSessions.broadcastTo(this, serializedObj)
}

/**
 * Toggle the read status on a notification.
 *
 * @param userId The owner of the notification.
 * @param notificationId The ID of the notification.
 */
suspend fun toggleReadNotification(userId: String, notificationId: UUID) = query {
    Notifications.update({
        (Notifications.userId eq userId) and (Notifications.id eq notificationId)
    }) {
        it[Notifications.read] = not(Notifications.read)
    }
}
