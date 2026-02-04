package app.burrow.burrows.models

import app.burrow.account.models.getUserByID
import app.burrow.burrows.MONTHLY
import app.burrow.burrows.NOT_REOCCURRING
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonContentPolymorphicSerializer
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject

object BaseSerializer : JsonContentPolymorphicSerializer<SubmittedBurrow>(SubmittedBurrow::class) {
    override fun selectDeserializer(
        element: JsonElement
    ): DeserializationStrategy<SubmittedBurrow> {
        val jsonObject = element.jsonObject
        return when {
            jsonObject.containsKey("objective") -> SubmittedProjectBurrow.serializer()
            jsonObject.containsKey("location") -> SubmittedStudyEventBurrow.serializer()
            else -> throw IllegalArgumentException("Unsupported Base type.")
        }
    }
}

@Serializable(BaseSerializer::class)
sealed class SubmittedBurrow {
    abstract val kind: BurrowKind
}

/**
 * A meeting submission for [BurrowKind.PROJECT]
 *
 * @see app.burrow.burrows.Burrow
 */
@Serializable
data class SubmittedProjectBurrow(
    val name: String,
    val objective: String,
    val className: String,
    val teamMembers: List<String>,
    val dueDate: Long,
    override val kind: BurrowKind,
) : SubmittedBurrow() {
    /**
     * Ensure that a [app.burrow.burrows.models.SubmittedProjectBurrow] is valid.
     *
     * @param isUpdating If the user is updating a pre-existing Burrow. If so, [teamMembers] should
     *   not have any.
     */
    suspend fun validateSubmittedBurrow(isUpdating: Boolean): List<String> {
        val errors = mutableListOf<String>()

        // ensure name is between 1..64 characters
        val nameLen = name.trim().length
        if (nameLen !in 1..64) {
            errors += "Name must be between 1 and 64 characters."
        }

        // ensure objective is within 1..256
        val objLen = objective.trim().length
        if (objLen !in 1..256) {
            errors += "Objective must be between 1 and 256 characters."
        }

        // ensure className is within 1..64
        val classLen = className.trim().length
        if (classLen !in 0..64) {
            errors += "Class name must be between 0 and 64 characters."
        }

        // ensure there's at least 1 team member and at most 10
        if (!isUpdating && teamMembers.isEmpty()) {
            errors += "You must have at least 1 team member."
        }

        // no team members on update
        if (isUpdating && teamMembers.isNotEmpty()) {
            errors += "You may not include any team members while updating!"
        }

        if (teamMembers.size > 10) {
            errors += "You may not have over 10 team members!"
        }

        // make sure that all team members are real
        teamMembers.forEachIndexed { idx, memberID ->
            try {
                getUserByID(memberID)
            } catch (_: Exception) {
                errors += "Member ${idx + 1} has not been found!"
            }
        }

        // make sure that due date is in the future
        val nowMillis = System.currentTimeMillis()
        if (dueDate <= nowMillis) {
            errors += "Due date must be in the future."
        }

        return errors
    }
}

/**
 * A meeting submission for [BurrowKind.EVENT] and [BurrowKind.STUDY].
 *
 * @see app.burrow.burrows.Burrow
 */
@Serializable
data class SubmittedStudyEventBurrow(
    val title: String,
    val description: String,
    val location: String,
    override val kind: BurrowKind,
    val beginningTime: Long,
    val endTime: Long,
    val tags: Set<String>,
    val capacity: Int,
    val visibility: BurrowVisibility,
    val requestToJoin: Boolean,
    val reoccurring: Int,
) : SubmittedBurrow() {
    /** Validate the Burrow. */
    fun validateSubmittedBurrow(): List<String> {
        val errors = mutableListOf<String>()

        // ensure there's between 1..32 characters
        val titleLen = title.trim().length
        if (titleLen !in 1..32) {
            errors += "Title must be between 1 and 32 characters."
        }

        // ensure description is within 0..256
        val descLen = description.trim().length
        if (descLen != 0 && descLen > 256) {
            errors += "Description must be empty or at most 256 characters."
        }

        // ensure location is within 0..64
        val locLen = location.trim().length
        if (locLen != 0 && locLen > 64) {
            errors += "Location must be empty or at most 64 characters."
        }

        // ensure there's at most 10 tags
        if (tags.size > 10) {
            errors += "You must have under 10 tags!"
        }

        tags.forEachIndexed { idx, tag ->
            if (tag.length > 10 || tag.trim().isEmpty())
                errors += "Tag ${idx + 1} must be between 1 and 10 characters."
        }

        // capacity
        if (capacity > 100) {
            errors += "Capacity must be less than 100."
        }

        // if capacity 0, then there's no limit
        if (capacity <= 2 && capacity != 0) {
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

        // ensure proper reoccurring value
        if (reoccurring !in NOT_REOCCURRING..MONTHLY) {
            errors += "Invalid reoccurring setting."
        }

        return errors
    }
}
