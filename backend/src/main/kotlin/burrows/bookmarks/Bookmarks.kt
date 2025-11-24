package app.burrow.burrows.bookmarks

import app.burrow.account.Users
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Bookmark]. */
object Bookmarks : Table("bookmarks") {
    /** [Bookmark.meetingID] */
    val meetingID =
        reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_bookmarks_meetingID")

    /** [Bookmark.userID] */
    val userID =
        reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_bookmarks_userID")

    /** [Bookmark.createdAt] */
    val createdAt = long("created_at")
}
