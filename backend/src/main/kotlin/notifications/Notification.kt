package app.burrow.notifications

import app.burrow.burrows.sync.chat.ChatMessage
import app.burrow.models.PaginatedResponse
import app.burrow.notifications.delivery.deliver
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlin.math.ceil
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.not
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
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
    val meetingId: String?,
    val kind: NotificationKind?,
    val title: String,
    val content: String,
    val sentDate: Long?,
    val scheduledDate: Long,
    val read: Boolean,
) {
    companion object {
        /** Create a [Notification] from a [row]. */
        fun fromRow(row: ResultRow): Notification =
            Notification(
                row[Notifications.id],
                row[Notifications.userId],
                row[Notifications.meetingId],
                row[Notifications.kind],
                row[Notifications.title],
                row[Notifications.content],
                row[Notifications.sentDate],
                row[Notifications.scheduledDate],
                row[Notifications.read],
            )
    }
}

/**
 * The amount of notifications to show per page.
 *
 * @see getNotifications
 */
private const val NOTIFICATIONS_PER_PAGE = 20

/**
 * Get a user's notifications.
 *
 * @param userID The user to retrieve the notifications for.
 * @param page The page of notifications to retrieve.
 * @see NOTIFICATIONS_PER_PAGE
 */
suspend fun getNotifications(userID: String, page: Int): PaginatedResponse<Notification> = query {
    val notificationsQuery =
        Notifications.selectAll().where {
            (Notifications.userId eq userID) and (Notifications.sentDate neq null)
        }

    val totalNotifications = notificationsQuery.count()
    val notifications =
        notificationsQuery
            .offset((page - 1L) * NOTIFICATIONS_PER_PAGE)
            .limit(NOTIFICATIONS_PER_PAGE)
            .orderBy(Notifications.sentDate, SortOrder.DESC)
            .map { Notification.fromRow(it) }
            .toList()

    PaginatedResponse(
        page,
        ceil(totalNotifications.toDouble() / NOTIFICATIONS_PER_PAGE).toInt(),
        totalNotifications,
        notifications,
    )
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
suspend fun createNotification(
    title: String,
    content: String,
    userId: String,
    meetingId: String? = null,
    kind: NotificationKind? = null,
) {
    val uuid = UUID.randomUUID()
    val currentTime = getTimeMillis()

    val obj =
        Notification(
            id = uuid,
            userId = userId,
            meetingId = meetingId,
            kind = kind,
            title = title,
            content = content,
            scheduledDate = currentTime,
            sentDate = currentTime,
            read = false,
        )

    query {
        Notifications.insert {
            it[Notifications.id] = uuid
            it[Notifications.userId] = userId
            it[Notifications.meetingId] = meetingId
            it[Notifications.kind] = obj.kind
            it[Notifications.title] = title
            it[Notifications.content] = content
            it[Notifications.scheduledDate] = currentTime
            it[Notifications.sentDate] = currentTime
            it[Notifications.read] = false
        }
    }

    obj.deliver()
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
