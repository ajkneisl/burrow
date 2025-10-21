package app.burrow.groups.bookmarks

import app.burrow.account.Users
import app.burrow.groups.Meetings
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table for [Bookmark]. */
object Bookmarks : Table("bookmarks") {
    val meetingId = reference("meeting_id", Meetings.id, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = long("created_at")
}
