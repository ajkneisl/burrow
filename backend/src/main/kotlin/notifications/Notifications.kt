package app.burrow.notifications

import app.burrow.account.Users
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

/**
 * A user's notification
 */
object Notifications : Table("notifications") {
    val id = uuid("notifications_id").uniqueIndex()
    val userId = reference("user_id", Users.googleID, onDelete = ReferenceOption.CASCADE)

    val title = varchar("title", 128)
    val content = text("content")
    val read = bool("read")
    val date = long("date")

    override val primaryKey = PrimaryKey(id)
}
