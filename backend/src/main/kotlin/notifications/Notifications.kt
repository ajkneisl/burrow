package app.burrow.notifications

import app.burrow.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** A user's notification */
object Notifications : Table("notifications") {
    val id = uuid("notifications_id").uniqueIndex()
    val userId = reference("user_id", Users.googleID, onDelete = ReferenceOption.CASCADE)

    val title = varchar("title", 128)
    val content = text("content")
    val read = bool("read")

    // when the notification was sent to the user
    // this is the time the user sees
    val sentDate = long("sent_date")

    // when the notification is scheduled to be sent
    val scheduledDate = long("scheduled_date").nullable().default(null)

    override val primaryKey = PrimaryKey(id)
}
