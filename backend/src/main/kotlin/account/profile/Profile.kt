package app.burrow.account.profile

import app.burrow.account.Users
import app.burrow.errors.ServerError
import app.burrow.query
import kotlinx.coroutines.flow.count
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * The profiles table.
 *
 * @see Profile
 */
object Profiles : Table("profiles") {
    val userID = reference("user_id", Users.id, ReferenceOption.CASCADE)

    val name = varchar("name", 64)
    val bio = varchar("bio", 512).nullable().default(null)
    val phoneNumber = varchar("phone_number", 128).nullable().default(null)

    val gradYear = integer("grad_year").nullable().default(null)
    val classes = text("classes").nullable().default(null)
}

/**
 * A user's profile.
 *
 * @param userID The user's ID.
 * @param name The chosen display name of the user.
 * @param bio The optional bio. This should be a short description of who they are.
 * @param phoneNumber An optional phone number.
 */
@Serializable
data class Profile(
    val userID: String,
    val name: String,
    val bio: String?,
    val gradYear: Int?,
    val classes: List<String>?,
    val phoneNumber: String?
) {
    /** Validate this profile. */
    fun validate() {
        // validate name
        if (name.isBlank() || name.length > 64)
            throw ServerError(400, "Name must be between 1 and 64 characters.")

        if (!nameRegex.matches(name)) throw ServerError(400, "Name contains invalid characters.")

        if (classes != null && classes.isNotEmpty()) {
            val normalized = classes.map { it.trim() }
            val invalid = normalized.filterNot(::isValidUmnClass)
            if (invalid.isNotEmpty()) {
                throw ServerError(400, "Invalid UMN class codes: ${invalid.joinToString(", ")}.")
            }
        }

        // todo: does this need to be different?
        if (gradYear != null && gradYear !in 2020..2035)
            throw ServerError(400, "Invalid graduation year!")

        // validate bio
        if (bio != null && bio.length > 512)
            throw ServerError(400, "Bio must be under 512 characters.")

        // validate phone number
        if (phoneNumber != null && !phoneRegex.matches(phoneNumber)) {
            throw ServerError(400, "Invalid phone number format.")
        }
    }

    companion object {
        private val nameRegex = Regex("^[A-Za-z\\-\\s']+$")
        private val phoneRegex = Regex("^\\+?[0-9. ()-]{7,25}$")

        private val umnClassRegex = Regex("^[A-Z]{3,4}\\s[1-8][0-9]{3}[A-Z]?$")

        /**
         * Returns true if [course] looks like a valid UMN course code (e.g., `CSCI 2021`, `MATH
         * 1271`, `CSCI 1933H`).
         */
        private fun isValidUmnClass(course: String): Boolean {
            val canonical = course.trim().uppercase().replace(Regex("\\s+"), " ")
            return umnClassRegex.matches(canonical)
        }

        /** Get a [Profile] from a [row] */
        fun fromRow(row: ResultRow): Profile =
            Profile(
                userID = row[Profiles.userID],
                name = row[Profiles.name],
                bio = row[Profiles.bio],
                gradYear = row[Profiles.gradYear],
                classes = row[Profiles.classes]?.let { Json.decodeFromString(it) },
                phoneNumber = row[Profiles.phoneNumber],
            )
    }
}

/** Get a user's profile by their [userID]. */
suspend fun getProfile(userID: String): Profile? = query {
    Profiles.selectAll()
        .where { Profiles.userID eq userID }
        .map { Profile.fromRow(it) }
        .singleOrNull()
}

/** Update a user's [profile]. */
suspend fun updateProfile(profile: Profile) = query {
    Profiles.update({ Profiles.userID eq profile.userID }) {
        it[name] = profile.name
        it[bio] = profile.bio
        it[phoneNumber] = profile.phoneNumber
    }
}
