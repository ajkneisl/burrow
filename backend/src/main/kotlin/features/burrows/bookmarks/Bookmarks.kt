package app.burrow.features.burrows.bookmarks

import app.burrow.features.account.Users
import app.burrow.features.burrows.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Bookmark]. */
object Bookmarks : Table("bookmarks") {
    /** [Bookmark.burrowID] */
    val burrowID =
        reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_bookmarks_meetingID")

    /** [Bookmark.userID] */
    val userID =
        reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_bookmarks_userID")

    /** [Bookmark.createdAt] */
    val createdAt = long("created_at")
}
