package app.burrow.notifications

import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory

/** Worker to send out notifications. */
fun notificationWorker() {
    val logger = LoggerFactory.getLogger("Notification Worker")
    val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    scope.launch {
        while (isActive) {
            logger.debug("Polling notifications...")

            try {
                pollNotifications(getTimeMillis()).collect { notification ->
                    notification.userId send notification
                }
            } catch (_: Throwable) {
                /* empty */
            }

            delay(15_000)
        }
    }
}

/** Find all notifications that should be sent and send them. */
suspend fun pollNotifications(nowMs: Long): Flow<Notification> {
    val items: List<Notification> = query {
        val notifReq =
            """
            WITH claimed AS (
                SELECT notifications_id
                FROM notifications
                WHERE sent_date IS NULL AND scheduled_date <= $nowMs
                ORDER BY scheduled_date
                FOR UPDATE SKIP LOCKED
                LIMIT 200
            )
            UPDATE notifications n
            SET sent_date = $nowMs
            FROM claimed c
            WHERE n.notifications_id = c.notifications_id
            RETURNING n.notifications_id, n.user_id, n.title, n.content, n.scheduled_date, n.sent_date, n.read
        """
                .trimIndent()

        val flow =
            exec(notifReq) { rs ->
                Notification(
                    id = UUID.fromString(rs.get("notifications_id") as String),
                    userId = rs.get("user_id") as String,
                    title = rs.get("title") as String,
                    content = rs.get("content") as String,
                    sentDate = rs.get("sent_date") as Long,
                    scheduledDate = rs.get("scheduled_date") as Long,
                    read = rs.get("read") as Boolean,
                )
            } ?: emptyFlow()

        flow.filterNotNull().toList()
    }

    return items.asFlow()
}
