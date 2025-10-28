package app.burrow.groups.bookmarks

import app.burrow.errors.ServerError
import app.burrow.burrowLogger
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * A bookmark on a meeting from a user.
 *
 * @param userId The user who bookmarked the [meetingId].
 * @param meetingId The bookmarked meeting.
 * @param createdAt When the bookmark was created.
 * @see Bookmarks
 */
data class Bookmark(val userId: String, val meetingId: String, val createdAt: Long) {
    companion object {
        /**
         * Form a [Bookmark] from a [ResultRow].
         *
         * @param row A row containing a Bookmark.
         */
        fun fromRow(row: ResultRow): Bookmark {
            return Bookmark(
                row[Bookmarks.userId],
                row[Bookmarks.meetingId],
                row[Bookmarks.createdAt],
            )
        }
    }
}

/**
 * Create a bookmark from [userId] on [meetingId].
 *
 * @param userId The user who's creating the bookmark.
 * @param meetingId The meeting to bookmark.
 * @throws ServerError If there's already a bookmark on this meeting.
 */
suspend fun createBookmark(userId: String, meetingId: String) {
    val existingBookmark = query {
        Bookmarks.selectAll()
            .where { (Bookmarks.userId eq userId) and (Bookmarks.meetingId eq meetingId) }
            .firstOrNull()
    }

    // already bookmarked :(
    if (existingBookmark != null) {
        throw ServerError(400, "This meeting is already bookmarked!")
    }

    burrowLogger.info("{} has bookmarked {}", userId, meetingId)

    query {
        Bookmarks.insert {
            it[Bookmarks.userId] = userId
            it[Bookmarks.meetingId] = meetingId
            it[Bookmarks.createdAt] = getTimeMillis()
        }
    }
}

/**
 * Delete a bookmark from [userId] on [meetingId].
 *
 * @param userId The user deleting the bookmark.
 * @param meetingId The meeting to delete the bookmark from.
 * @throws ServerError If the bookmark doesn't exist.
 */
suspend fun deleteBookmark(userId: String, meetingId: String) {
    val existingBookmark = query {
        Bookmarks.selectAll()
            .where { (Bookmarks.userId eq userId) and (Bookmarks.meetingId eq meetingId) }
            .firstOrNull()
    }

    // isn't bookmarked
    if (existingBookmark == null) {
        throw ServerError(400, "This meeting is not bookmarked!")
    }

    burrowLogger.info("{} has un-bookmarked {}", userId, meetingId)

    query {
        Bookmarks.deleteWhere {
            (Bookmarks.userId eq userId) and (Bookmarks.meetingId eq meetingId)
        }
    }
}

/**
 * Get all of a [userId]'s [Bookmark]s.
 *
 * @param userId The user to get the [Bookmark]s for
 * @return A map of the meeting ID to the [Bookmark].
 */
suspend fun getBookmarks(userId: String): Map<String, Bookmark> = query {
    Bookmarks.selectAll()
        .where { Bookmarks.userId eq userId }
        .toList()
        .associate { row -> row[Bookmarks.userId] to Bookmark.fromRow(row) }
}
