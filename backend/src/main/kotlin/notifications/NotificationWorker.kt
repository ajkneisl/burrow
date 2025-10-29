package app.burrow.notifications

import app.burrow.account.settings.Settings
import app.burrow.groups.Meetings
import app.burrow.groups.membership.Memberships
import app.burrow.groups.membership.getAttendees
import app.burrow.groups.models.MeetingMemberStatus
import app.burrow.notifications.delivery.deliver
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID
import kotlin.time.measureTime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.upsert
import org.slf4j.LoggerFactory

private val LOGGER = LoggerFactory.getLogger("Notification Worker")

/** Worker to send out notifications. */
fun notificationWorker() {
    val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    scope.launch {
        while (isActive) {
            val time = measureTime {
                try {
                    pollNotifications(getTimeMillis()).collect(Notification::deliver)
                } catch (ex: Throwable) {
                    LOGGER.error("Failed to poll notifications", ex)
                }
            }

            LOGGER.debug("Polled notifications in $time ms")

            delay(60_000) // poll every minute
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
                    id = rs.get("notifications_id") as UUID,
                    userId = rs.get("user_id") as String,
                    meetingId = rs.get("meeting_id") as String,
                    kind = NotificationKind.valueOf(rs.get("kind") as String),
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

/** The default preferences. This only has SSE delivery. */
private const val DEFAULT_NOTIFICATION_DELIVERY: Short = 0b0000_0001

/** The default lead for a notification. 30 minutes. */
private const val DEFAULT_NOTIFICATION_LEAD: Short = 30

/**
 * Get a user's notification preferences on a given notification kind.
 *
 * @param userId The ID of the user.
 * @param kind The notification kind.
 * @return Triple (if it's enabled, the amount of time to delay the notification for, the delivery
 *   channels)
 * @see NotificationKind
 */
private suspend fun getNotificationPreferences(
    userId: String,
    kind: NotificationKind,
): Triple<Boolean, Short, Short> = query {
    // global preferences
    val globalEnabled =
        Settings.select(Settings.notificationsEnabled)
            .where { Settings.userId eq userId }
            .limit(1)
            .firstOrNull()
            ?.get(Settings.notificationsEnabled) ?: true

    // specific kind preferences
    val kindPreferences =
        NotificationPreferences.selectAll()
            .where {
                (NotificationPreferences.userId eq userId) and
                    (NotificationPreferences.kind eq kind)
            }
            .limit(1)
            .firstOrNull()

    // if this notification is enabled
    val enabled = kindPreferences?.get(NotificationPreferences.enabled) ?: globalEnabled

    val deliveryChannels: Short =
        (kindPreferences?.get(NotificationPreferences.deliveryChannels)
            ?: Settings.select(Settings.defaultNotificationDelivery)
                .where { Settings.userId eq userId }
                .limit(1)
                .firstOrNull()
                ?.get(Settings.defaultNotificationDelivery)
            ?: DEFAULT_NOTIFICATION_DELIVERY)

    val lead: Short =
        when (kind) {
            NotificationKind.UPCOMING_MEETING ->
                (kindPreferences?.get(NotificationPreferences.leadMinutes)
                    ?: DEFAULT_NOTIFICATION_LEAD)
            else -> 0
        }

    Triple(enabled, lead, deliveryChannels)
}

private val dateFormat: DateTimeFormatter =
    DateTimeFormatter.ofPattern("EEE, MMM d h:mm a").withZone(ZoneId.of("America/Chicago"))

/**
 * Insert / Create a notification for an upcoming meeting.
 *
 * @param meetingRow
 * @param userId The ID of the user to create this for.
 */
private suspend fun upsertUpcomingForUser(
    meetingRow: ResultRow,
    userId: String,
    nowMs: Long = getTimeMillis(),
) = query {
    val meetingId = meetingRow[Meetings.id]
    val title = "“${meetingRow[Meetings.title]}” starts soon"
    val content = buildString {
        val startTime = dateFormat.format(Instant.ofEpochMilli(meetingRow[Meetings.beginningTime]))

        append("Starts at ")
        append(startTime)
        append(" at ")
        append(meetingRow[Meetings.location])
    }

    val (enabled, leadMin, _) =
        getNotificationPreferences(userId, NotificationKind.UPCOMING_MEETING)

    // when this notification should be sent
    val scheduleDate = (meetingRow[Meetings.beginningTime] - leadMin * 60_000L)

    LOGGER.debug("Scheduling notification for $userId for $meetingId at $scheduleDate")

    // if this is going to be scheduled in the past or the notification type is disabled.
    if (!enabled || scheduleDate <= nowMs) {
        // remove any pending unsent UPCOMING_MEETING notifications for this user/meeting
        Notifications.deleteWhere {
            (Notifications.userId eq userId) and
                (Notifications.meetingId eq meetingId) and
                (Notifications.kind eq NotificationKind.UPCOMING_MEETING) and
                (Notifications.sentDate.isNull())
        }

        return@query
    }

    // update or insert
    Notifications.upsert(Notifications.userId, Notifications.meetingId, Notifications.kind) {
        it[id] = UUID.randomUUID()
        it[Notifications.userId] = userId
        it[Notifications.meetingId] = meetingId
        it[kind] = NotificationKind.UPCOMING_MEETING
        it[Notifications.title] = title
        it[Notifications.content] = content
        it[read] = false
        it[sentDate] = null
        it[scheduledDate] = scheduleDate
    }
}

/**
 * Get all the IDs of user's attending a meeting.
 *
 * @param meetingId The ID of the meeting.
 * @return All users attending the meeting, including the owner.
 */
private suspend fun attendeeIds(meetingId: String): List<String> = query {
    Memberships.select(Memberships.userID)
        .where {
            (Memberships.meetingID eq meetingId) and
                (Memberships.status eq MeetingMemberStatus.JOINED)
        }
        .map { it[Memberships.userID] }
        .toList()
}

/**
 * When a meeting is updated, re-schedule upcoming meeting notifications.
 *
 * @param meetingId The ID of the meeting to reschedule.
 * @param nowMs The current time.
 */
suspend fun rescheduleNotificationsForMeeting(meetingId: String, nowMs: Long = getTimeMillis()) {
    LOGGER.debug("Scheduling notifications for $meetingId")

    val meetingRow =
        query { Meetings.selectAll().where { Meetings.id eq meetingId }.firstOrNull() } ?: return

    val attendees = getAttendees(meetingId)

    println(attendees)

    attendees.forEach { userId -> upsertUpcomingForUser(meetingRow, userId.user.id, nowMs) }
}

/**
 * When a user joins a meeting. Creates a scheduled notification.
 *
 * @param userId The user who joined the meeting.
 * @param meetingId The ID of the meeting.
 * @param nowMs The current time.
 */
suspend fun onUserJoinedMeeting(userId: String, meetingId: String, nowMs: Long = getTimeMillis()) {
    query {
        val meeting =
            Meetings.selectAll().where { Meetings.id eq meetingId }.firstOrNull() ?: return@query
        upsertUpcomingForUser(meeting, userId, nowMs)
    }
}

/**
 * When a user leaves a meeting. This deletes the notification that would've been scheduled.
 *
 * @param userId The user who left the meeting.
 * @param meetingId The ID of the meeting they left.
 */
suspend fun onUserLeaveMeeting(userId: String, meetingId: String) {
    query {
        Notifications.deleteWhere {
            (Notifications.userId eq userId) and
                (Notifications.meetingId eq meetingId) and
                (Notifications.kind eq NotificationKind.UPCOMING_MEETING) and
                (Notifications.sentDate.isNull())
        }
    }
}

/**
 * When a user changes their settings for notifications. This reschedules their upcoming meeting
 * notifications.
 *
 * @param userId The ID of the user.
 * @param nowMs The current time.
 */
suspend fun onUserSettingsChanged(userId: String, nowMs: Long = getTimeMillis()) {
    query {
        Meetings.leftJoin(Memberships, { Meetings.id }, { Memberships.meetingID })
            .select(
                Meetings.id,
                Meetings.beginningTime,
                Meetings.title,
                Meetings.location,
                Meetings.owner,
                Memberships.userID,
                Memberships.status,
            )
            .where {
                (Meetings.beginningTime greater nowMs) and
                    ((Meetings.owner eq userId) or
                        ((Memberships.userID eq userId) and
                            (Memberships.status eq MeetingMemberStatus.JOINED)))
            }
            .withDistinct()
            .map { it[Meetings.id] }
            .collect { mid ->
                val row = Meetings.selectAll().where { Meetings.id eq mid }.first()
                upsertUpcomingForUser(row, userId, nowMs)
            }
    }
}
