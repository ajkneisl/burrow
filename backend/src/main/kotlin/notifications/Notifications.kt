package app.burrow.notifications

import app.burrow.account.Users
import app.burrow.groups.Meetings
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** A user's notification */
object Notifications : Table("notifications") {
    /** A unique ID for the notification. */
    val id = uuid("notifications_id").uniqueIndex()

    /** The recipient of the notification. */
    val userId = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** The ID of the meeting associated with */
    val meetingId =
        reference("meeting_id", Meetings.id, onDelete = ReferenceOption.CASCADE)
            .nullable()
            .default(null)

    /**
     * The type of notification.
     *
     * By default, this is `null`, which is just a general notification.
     */
    val kind = enumeration<NotificationKind>("kind").nullable()

    /** The title of the notification */
    val title = varchar("title", 128)

    /** The content of the notification. */
    val content = text("content")

    /** If the notification has been read. */
    val read = bool("read")

    /** The date when the notification was sent to the user. */
    val sentDate = long("sent_date").nullable().default(null)

    /** When the notification has been scheduled to be sent. */
    val scheduledDate = long("scheduled_date")

    val userMeetingKindUnique = uniqueIndex(
        "notifications_user_meeting_kind_unique",
        userId,
        meetingId,
        kind
    )


    override val primaryKey = PrimaryKey(id)
}
