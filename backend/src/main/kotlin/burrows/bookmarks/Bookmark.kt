package app.burrow.burrows.bookmarks

import app.burrow.Error
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
 * @param userID The user who bookmarked the [meetingID].
 * @param meetingID The bookmarked meeting.
 * @param createdAt When the bookmark was created.
 * @see Bookmarks
 */
data class Bookmark(val userID: String, val meetingID: String, val createdAt: Long) {
    companion object {
        /**
         * Form a [Bookmark] from a [ResultRow].
         *
         * @param row A row containing a Bookmark.
         */
        fun fromRow(row: ResultRow): Bookmark {
            return Bookmark(
                row[Bookmarks.userID],
                row[Bookmarks.meetingID],
                row[Bookmarks.createdAt],
            )
        }
    }
}

/**
 * Create a bookmark from [userID] on [meetingID].
 *
 * @param userID The user who's creating the bookmark.
 * @param meetingID The meeting to bookmark.
 * @throws Error If there's already a bookmark on this meeting.
 */
suspend fun createBookmark(userID: String, meetingID: String) {
    val existingBookmark = query {
        Bookmarks.selectAll()
            .where { (Bookmarks.userID eq userID) and (Bookmarks.meetingID eq meetingID) }
            .firstOrNull()
    }

    // already bookmarked :(
    if (existingBookmark != null) {
        throw Error(400, "This meeting is already bookmarked!")
    }

    burrowLogger.info("{} has bookmarked {}", userID, meetingID)

    query {
        Bookmarks.insert {
            it[Bookmarks.userID] = userID
            it[Bookmarks.meetingID] = meetingID
            it[Bookmarks.createdAt] = getTimeMillis()
        }
    }
}

/**
 * Delete a bookmark from [userID] on [meetingID].
 *
 * @param userID The user deleting the bookmark.
 * @param meetingID The meeting to delete the bookmark from.
 * @throws Error If the bookmark doesn't exist.
 */
suspend fun deleteBookmark(userID: String, meetingID: String) {
    val existingBookmark = query {
        Bookmarks.selectAll()
            .where { (Bookmarks.userID eq userID) and (Bookmarks.meetingID eq meetingID) }
            .firstOrNull()
    }

    // isn't bookmarked
    if (existingBookmark == null) {
        throw Error(400, "This meeting is not bookmarked!")
    }

    burrowLogger.info("{} has un-bookmarked {}", userID, meetingID)

    query {
        Bookmarks.deleteWhere {
            (Bookmarks.userID eq userID) and (Bookmarks.meetingID eq meetingID)
        }
    }
}

/**
 * Get all of a [userID]'s [Bookmark]s.
 *
 * @param userID The user to get the [Bookmark]s for
 * @return A map of the meeting ID to the [Bookmark].
 */
suspend fun getBookmarks(userID: String): Map<String, Bookmark> = query {
    Bookmarks.selectAll()
        .where { Bookmarks.userID eq userID }
        .toList()
        .associate { row -> row[Bookmarks.userID] to Bookmark.fromRow(row) }
}
