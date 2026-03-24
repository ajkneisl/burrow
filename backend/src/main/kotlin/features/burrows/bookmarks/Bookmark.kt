package app.burrow.features.burrows.bookmarks

import app.burrow.api.MappedTable
import app.burrow.api.Error
import app.burrow.LOGGER
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * A bookmark on a meeting from a user.
 *
 * @param userID The user who bookmarked the [burrowID].
 * @param burrowID The bookmarked meeting.
 * @param createdAt When the bookmark was created.
 * @see Bookmarks
 */
@Serializable @MappedTable(Bookmarks::class) data class Bookmark(val userID: String, val burrowID: String, val createdAt: Long)

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
            .where { (Bookmarks.userID eq userID) and (Bookmarks.burrowID eq meetingID) }
            .firstOrNull()
    }

    // already bookmarked :(
    if (existingBookmark != null) {
        throw Error(400, "This meeting is already bookmarked!")
    }

    LOGGER.info("{} has bookmarked {}", userID, meetingID)

    query {
        Bookmarks.insert {
            it[Bookmarks.userID] = userID
            it[Bookmarks.burrowID] = meetingID
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
            .where { (Bookmarks.userID eq userID) and (Bookmarks.burrowID eq meetingID) }
            .firstOrNull()
    }

    // isn't bookmarked
    if (existingBookmark == null) {
        throw Error(400, "This meeting is not bookmarked!")
    }

    LOGGER.info("{} has un-bookmarked {}", userID, meetingID)

    query {
        Bookmarks.deleteWhere { (Bookmarks.userID eq userID) and (Bookmarks.burrowID eq meetingID) }
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
        .associate { row -> row[Bookmarks.userID] to row.toEntity<Bookmark>(Bookmarks) }
}
