package app.burrow.notifications

import app.burrow.account.Users
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table of [Notification] */
object Notifications : Table("notifications") {
    /** [Notification.id] */
    val id = uuid("notifications_id").uniqueIndex()

    /** [Notification.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [Notification.burrowID] */
    val burrowID =
        reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
            .nullable()
            .default(null)

    /** [Notification.kind] */
    val kind = enumeration<NotificationKind>("kind").nullable()

    /** [Notification.title] */
    val title = varchar("title", 128)

    /** [Notification.content] */
    val content = text("content")

    /** [Notification.read] */
    val read = bool("read")

    /** [Notification.sentDate] */
    val sentDate = long("sent_date").nullable().default(null)

    /** [Notification.scheduledDate] */
    val scheduledDate = long("scheduled_date")

    val userMeetingKindUnique =
        uniqueIndex("notifications_user_meeting_kind_unique", userID, burrowID, kind)

    override val primaryKey = PrimaryKey(id)
}
