package app.burrow.account.profile

import app.burrow.MultiError
import app.burrow.account.Users
import app.burrow.json
import app.burrow.query
import io.ktor.client.request.get
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.Alias
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * The profiles table.
 *
 * @see Profile
 */
object Profiles : Table("profiles") {
    /** [Profile.userID] */
    val userID = reference("user_id", Users.id, ReferenceOption.CASCADE).uniqueIndex()

    /** [Profile.name] */
    val name = varchar("name", 64)

    /** [Profile.visibility] */
    val visibility =
        enumeration<Profile.Visibility>("visibility").default(Profile.Visibility.PUBLIC)

    /** [Profile.bio] */
    val bio = varchar("bio", 512).nullable().default(null)

    /** [Profile.phoneNumber] */
    val phoneNumber = varchar("phone_number", 128).nullable().default(null)

    /** [Profile.instagram] */
    val instagram = varchar("instagram", 32).nullable().default(null)

    /** [Profile.linkedIn] */
    val linkedIn = varchar("linkedIn", 64).nullable().default(null)

    /** [Profile.gradYear] */
    val gradYear = integer("grad_year").nullable().default(null)

    /** [Profile.classes] */
    val classes = text("classes").nullable().default(null)

    /** [Profile.school] */
    val school = varchar("school", 255).nullable().default(null)

    /** [Profile.major] */
    val major = varchar("major", 255).nullable().default(null)
}

/**
 * A user's profile.
 *
 * @param userID The user's ID.
 * @param visibility The visibility of the profile.
 * @param name The chosen display name of the user.
 * @param bio The optional bio. This should be a short description of who they are.
 * @param phoneNumber An optional phone number.
 * @param instagram An optional instagram.
 */
@Serializable
data class Profile(
    /** The user's ID. */
    val userID: String,

    /** The user's chosen name. */
    val name: String,

    /** The visibility of the profile. */
    val visibility: Visibility,

    /** The user's bio. If `null`, the user has not set one. */
    val bio: String?,

    /** The user's graduation year. If `null`, the user has not set one. */
    val gradYear: Int?,

    /** The user's classes. If `null`, the user has not set one. */
    val classes: List<String>?,

    /** The user's school. If `null`, the user has not set one. */
    var school: String?,

    /** The user's major. If `null`, the user has not set one. */
    var major: String?,

    /** The user's phone number. If `null`, the user has not set one. */
    val phoneNumber: String?,

    /** The user's Instagram. If `null`, the user has not set one. */
    val instagram: String?,

    /** The user's LinkedIn. If `null`, the user has not set one. */
    val linkedIn: String?,
) {
    /** Profile visibility. */
    enum class Visibility {
        PUBLIC,
        PRIVATE,
        FRIENDS,
    }

    /**
     * Validate this profile.
     *
     * @throws MultiError If there's any issues with the profile
     */
    fun validate() {
        val errors = mutableListOf<String>()

        // validate name
        if (name.isBlank() || name.length > 64)
            errors.add("Name must be between 1 and 64 characters.")

        // validate name characters
        if (!nameRegex.matches(name)) errors.add("Invalid characters in name.")

        // validate classes
        if (classes != null && classes.isNotEmpty()) {
            val normalized = classes.map { it.trim() }
            val invalid = normalized.filterNot(::isValidUmnClass)

            if (invalid.isNotEmpty()) {
                errors.add("Invalid UMN class codes: ${invalid.joinToString(", ")}.")
            }
        }

        // todo: does this need to be different?
        if (gradYear != null && gradYear !in 2020..2035) errors.add("Invalid graduation year.")

        // validate school
        school.also {
            if (it != null) {
                // regular school name
                if (it.lowercase() in validSchools) {
                    val schoolName =
                        schoolsData
                            .find { schoolProfile -> schoolProfile.name.equals(it, true) }
                            ?.name

                    if (schoolName != null) {
                        school = schoolName
                        return@also
                    }
                }

                // school is shorthand (like CSE, CBAS etc)
                if (it.lowercase() in validShorthands) {
                    val schoolName =
                        schoolsData
                            .find { schoolProfile -> schoolProfile.shorthand.equals(it, true) }
                            ?.name

                    if (schoolName != null) {
                        school = schoolName
                        return@also
                    }
                }

                school = null
                errors.add("Invalid school.")
            }
        }

        // validate major
        (major to school).also { (ma, sc) ->
            if (ma != null) {
                if (sc == null) {
                    errors.add("To pick a major, you must have already chosen a school.")
                    return@also
                }

                if (ma.lowercase() !in validMajors) {
                    errors.add("Invalid major.")
                    return@also
                }

                val majorInSchool =
                    schoolsData
                        .single { profile -> profile.name == sc }
                        .majors
                        .find { majorName -> majorName.equals(ma, true) }

                if (majorInSchool == null) {
                    errors.add("That major is not in that school.")
                    return@also
                }

                major = majorInSchool
            }
        }

        // validate bio
        if (bio != null && bio.length > 512) errors.add("Bio must be under 512 characters.")

        // validate instagram
        if (instagram != null) {
            when {
                instagram.isBlank() || instagram.length > 32 -> {
                    errors.add("Instagram handle must be between 1 and 32 characters.")
                }
                !instagram.startsWith("@") -> {
                    errors.add("Instagram handle must start with '@'.")
                }
                !instaRegex.matches(instagram) -> {
                    errors.add("Instagram handle contains invalid characters.")
                }
            }
        }

        // validate linkedin
        if (linkedIn != null) {
            when {
                linkedIn.isBlank() || linkedIn.length > 64 -> {
                    errors.add("LinkedIn username must be between 1 and 64 characters.")
                }
                !linkedInRegex.matches(linkedIn.removePrefix("/in/")) -> {
                    errors.add("LinkedIn username contains invalid characters.")
                }
            }
        }

        // validate phone number
        if (phoneNumber != null && !phoneRegex.matches(phoneNumber)) {
            errors.add("Invalid phone number format.")
        }

        if (errors.isNotEmpty()) throw MultiError(400, errors)
    }

    companion object {
        private val instaRegex = Regex("^@[A-Za-z0-9._]+$")
        private val linkedInRegex = Regex("^[A-Za-z0-9\\-]+$")
        private val nameRegex = Regex("^[A-Za-z\\-\\s']+$")
        private val phoneRegex = Regex("^\\+?[0-9. ()-]{7,25}$")
        private val umnClassRegex = Regex("^[A-Z]{2,4}\\s[1-8][0-9]{3}[A-Z]?$")

        @Serializable
        private data class SchoolData(
            val name: String,
            val shorthand: String,
            val majors: List<String>,
        )

        /**
         * Information on which school has which major. This uses the `majors.json` file in the
         * `resources` folder.
         *
         * @see validSchools
         * @see validMajors
         */
        private val schoolsData: List<SchoolData> by lazy {
            val jsonText =
                this::class
                    .java
                    .classLoader
                    .getResourceAsStream("majors.json")
                    ?.bufferedReader()
                    ?.use { it.readText() }
                    ?: throw IllegalStateException("Could not load majors.json from resources")

            Json.decodeFromString<List<SchoolData>>(jsonText)
        }

        /** All valid schools at the University of Minnesota in lowercase. */
        private val validSchools: Set<String> by lazy {
            schoolsData.map { it.name.lowercase() }.toSet()
        }

        /** All valid school shorthands in the University of Minnesota in lowercase. */
        private val validShorthands by lazy { schoolsData.map { it.shorthand.lowercase() }.toSet() }

        /** All valid schools with their respective majors in lowercase. */
        private val schoolMajors: Map<String, Set<String>> by lazy {
            schoolsData.associate { profile ->
                profile.name to profile.majors.map { it.lowercase() }.toSet()
            }
        }

        /** All valid majors at the University of Minnesota. */
        private val validMajors: Set<String> by lazy {
            schoolsData.flatMap { it.majors }.map { it.lowercase() }.toSet()
        }

        /**
         * Checks if [course] looks like a valid University of Minnesota course. Like `CSCI 2021`,
         * `ABC 123` etc.
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
                school = row[Profiles.school],
                major = row[Profiles.major],
                instagram = row[Profiles.instagram],
                phoneNumber = row[Profiles.phoneNumber],
                linkedIn = row[Profiles.linkedIn],
                visibility = row[Profiles.visibility],
            )

        /** Get a [Profile] from a [row] using an aliased table */
        fun fromRow(row: ResultRow, alias: Alias<Profiles>): Profile =
            Profile(
                userID = row[alias[Profiles.userID]],
                name = row[alias[Profiles.name]],
                bio = row[alias[Profiles.bio]],
                gradYear = row[alias[Profiles.gradYear]],
                classes = row[alias[Profiles.classes]]?.let { Json.decodeFromString(it) },
                school = row[alias[Profiles.school]],
                major = row[alias[Profiles.major]],
                instagram = row[alias[Profiles.instagram]],
                phoneNumber = row[alias[Profiles.phoneNumber]],
                linkedIn = row[alias[Profiles.linkedIn]],
                visibility = row[alias[Profiles.visibility]],
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
        it[gradYear] = profile.gradYear
        it[classes] = json.encodeToString(profile.classes)
        it[school] = profile.school
        it[major] = profile.major
        it[instagram] = profile.instagram
        it[linkedIn] = profile.linkedIn
        it[visibility] = profile.visibility
    }
}
