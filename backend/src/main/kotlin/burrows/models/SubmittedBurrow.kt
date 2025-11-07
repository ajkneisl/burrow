package app.burrow.burrows.models

import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit
import kotlinx.serialization.Serializable

/** A meeting submission, un-checked. */
@Serializable
data class SubmittedBurrow(
    val title: String,
    val description: String,
    val location: String,
    val kind: BurrowType,
    val beginningTime: Long,
    val endTime: Long,
    val tags: Set<String>,
    val capacity: Int,
    val visibility: BurrowVisibility,
) {
    /** Validate the Burrow. */
    fun validateSubmittedGroupMeeting(): List<String> {
        val errors = mutableListOf<String>()

        // ensure there's between 1..32 characters
        val titleLen = title.length
        if (titleLen < 1 || titleLen > 32) {
            errors += "title must be between 2 and 32 characters."
        }

        // ensure description is within 0..256
        val descLen = description.length
        if (descLen != 0 && descLen > 256) {
            errors += "Description must be empty or at most 256 characters."
        }

        // ensure location is within 0..64
        val locLen = location.length
        if (locLen != 0 && locLen > 64) {
            errors += "Location must be empty or at most 64 characters."
        }

        // ensure there's at most 10 tags
        if (tags.size > 10) {
            errors += "You must have under 10 tags!"
        }

        tags.forEachIndexed { idx, tag ->
            if (tag.length > 10) errors += "Tag $idx must be under 10 characters."
        }

        // capacity
        if (capacity > 100) {
            errors += "Capacity must be less than 100."
        }

        // if capacity 0, then there's no limit
        if (capacity < 2 && capacity != 0) {
            errors += "Capacity must be greater than 2."
        }

        // make sure that beginning time isn't in the future
        val nowMillis = System.currentTimeMillis()
        if (beginningTime <= nowMillis) {
            errors += "Beginning time must be in the future."
        }

        // make sure it ends after it begins.
        if (endTime <= beginningTime) {
            errors += "End time must be after the beginning time."
        }

        // ensure that there's at least 15 minutes in the meeting.
        if (endTime - beginningTime <= TimeUnit.MINUTES.toMillis(15)) {
            errors += "The meeting time must be at least 15 minutes."
        }

        val zone = ZoneId.of("America/Chicago")
        fun dayKey(epochMillis: Long): Pair<Int, Int> {
            val zdt = ZonedDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), zone)
            return zdt.dayOfYear to zdt.year
        }

        val (bDay, bYear) = dayKey(beginningTime)
        val (eDay, eYear) = dayKey(endTime)

        if (bDay != eDay || bYear != eYear) {
            errors += "End time must be on the same calendar day as the beginning time."
        }

        return errors
    }
}
