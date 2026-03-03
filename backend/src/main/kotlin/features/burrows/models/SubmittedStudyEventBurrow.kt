package app.burrow.features.burrows.models

import app.burrow.api.verify.Verifiable
import app.burrow.api.verify.VerificationScope
import app.burrow.api.verify.Verifier
import app.burrow.features.account.models.getUserByID
import app.burrow.features.burrows.MONTHLY
import app.burrow.features.burrows.NOT_REOCCURRING
import app.burrow.features.burrows.models.enums.BurrowKind
import app.burrow.features.burrows.models.enums.BurrowVisibility
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

class SubmittedProjectBurrowVerifier(private val isUpdating: Boolean) :
    Verifier<SubmittedProjectBurrow>() {
    override suspend fun VerificationScope<SubmittedProjectBurrow>.rules() {
        SubmittedProjectBurrow::name {
            trimmedLengthIn(1..64, "Name must be between 1 and 64 characters.")
        }

        SubmittedProjectBurrow::objective {
            trimmedLengthIn(1..256, "Objective must be between 1 and 256 characters.")
        }

        SubmittedProjectBurrow::className {
            trimmedLengthIn(0..64, "Class name must be between 0 and 64 characters.")
        }

        SubmittedProjectBurrow::teamMembers {
            errorIf(!isUpdating && value.isEmpty(), "You must have at least 1 team member.")
            errorIf(
                isUpdating && value.isNotEmpty(),
                "You may not include any team members while updating!",
            )

            maxSize(10, "You may not have over 10 team members!")

            each { idx, memberID ->
                try {
                    getUserByID(memberID)
                    null
                } catch (_: Exception) {
                    "Member ${idx + 1} has not been found!"
                }
            }
        }

        SubmittedProjectBurrow::dueDate { inFuture("Due date must be in the future.") }
    }
}

/**
 * A meeting submission for [BurrowKind.PROJECT]
 *
 * @see Burrow
 */
@Serializable
data class SubmittedProjectBurrow(
    val name: String,
    val objective: String,
    val className: String,
    val teamMembers: List<String>,
    val dueDate: Long,
    override val kind: BurrowKind,
) : SubmittedBurrow()

class SubmittedStudyEventBurrowVerifier : Verifier<SubmittedStudyEventBurrow>() {
    override suspend fun VerificationScope<SubmittedStudyEventBurrow>.rules() {
        SubmittedStudyEventBurrow::title {
            trimmedLengthIn(1..32, "Title must be between 1 and 32 characters.")
        }

        SubmittedStudyEventBurrow::description {
            require("Description must be empty or at most 256 characters.") {
                it.isBlank() || it.trim().length <= 256
            }
        }

        SubmittedStudyEventBurrow::location {
            require("Location must be empty or at most 64 characters.") {
                it.isBlank() || it.trim().length <= 64
            }
        }

        SubmittedStudyEventBurrow::tags {
            maxSize(10, "You must have under 10 tags!")
            each { _, tag ->
                if (tag.length > 10 || tag.trim().isEmpty())
                    "Tags must be between 1 and 10 characters."
                else null
            }
        }

        SubmittedStudyEventBurrow::capacity {
            max(100, "Capacity must be less than 100.")
            require("Capacity must be greater than 2.") { it == 0 || it > 2 }
        }

        SubmittedStudyEventBurrow::beginningTime {
            inFuture("Beginning time must be in the future.")
        }

        SubmittedStudyEventBurrow::endTime {
            after(instance.beginningTime, "End time must be after the beginning time.")

            errorIf(
                value - instance.beginningTime <= TimeUnit.MINUTES.toMillis(15),
                "The meeting time must be at least 15 minutes.",
            )

            val zone = ZoneId.of("America/Chicago")
            fun dayKey(epochMillis: Long): Pair<Int, Int> {
                val zdt = ZonedDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), zone)
                return zdt.dayOfYear to zdt.year
            }

            val (bDay, bYear) = dayKey(instance.beginningTime)
            val (eDay, eYear) = dayKey(value)

            errorIf(
                bDay != eDay || bYear != eYear,
                "End time must be on the same calendar day as the beginning time.",
            )
        }

        SubmittedStudyEventBurrow::reoccurring {
            inRange(NOT_REOCCURRING..MONTHLY, "Invalid reoccurring setting.")
        }
    }
}

/**
 * A meeting submission for [BurrowKind.EVENT] and [BurrowKind.STUDY].
 *
 * @see Burrow
 */
@Verifiable(with = SubmittedStudyEventBurrowVerifier::class)
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
    val clubID: String? = null,
) : SubmittedBurrow()
