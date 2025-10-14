package app.burrow.notifications

import app.burrow.account.Users
import app.burrow.groups.sync.chat.ChatMessage
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.batchInsert
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.not
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update

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
    val date: Long,
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
                row[Notifications.date],
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
        .orderBy(Notifications.date, SortOrder.DESC)
        .map { Notification.fromRow(it) }
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

    val obj = Notification(uuid, userId, title, content, currentTime, false)
    val serializedObj = Json.encodeToString(obj)

    query {
        Notifications.insert {
            it[Notifications.id] = uuid
            it[Notifications.userId] = userId
            it[Notifications.title] = title
            it[Notifications.content] = content
            it[Notifications.date] = currentTime
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
            this[Notifications.date] = currentTime
            this[Notifications.read] = false

            val obj = Notification(uuid, userId, title, content, currentTime, false)
            val serializedObj = Json.encodeToString(obj)

            NotificationSessions.broadcastTo(userId, serializedObj)
        }
    }
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
