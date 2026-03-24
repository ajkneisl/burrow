package app.burrow.features.account.profile

import app.burrow.api.MappedTable
import app.burrow.api.verify.Verifiable
import app.burrow.api.verify.VerificationScope
import app.burrow.api.verify.Verifier
import app.burrow.features.account.Users
import app.burrow.json
import app.burrow.api.query
import app.burrow.api.toEntity
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
    val linkedIn = varchar("linked_in", 64).nullable().default(null)

    /** [Profile.gradYear] */
    val gradYear = integer("grad_year").nullable().default(null)

    /** [Profile.classes] */
    val classes = text("classes").nullable().default(null)

    /** [Profile.school] */
    val school = varchar("school", 255).nullable().default(null)

    /** [Profile.major] */
    val major = varchar("major", 255).nullable().default(null)

    /** [Profiles.badges] */
    val badges = array<String>("badges").default(emptyList())
}

/** A user's profile. */
@Verifiable(with = Profile.Companion.ProfileVerifier::class)
@Serializable
@MappedTable(Profiles::class)
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

    /** The user's badges. These are given by administrators. */
    val badges: List<String>,
) {
    /** Profile visibility. */
    enum class Visibility {
        PUBLIC,
        PRIVATE,
        FRIENDS,
    }

    /**
     * Normalize school and major fields to their canonical names.
     * Should be called before verification.
     */
    fun normalize() {
        school.also {
            if (it != null) {
                if (it.lowercase() in validSchools) {
                    school = schoolsData
                        .find { sp -> sp.name.equals(it, true) }
                        ?.name
                    return@also
                }

                if (it.lowercase() in validShorthands) {
                    school = schoolsData
                        .find { sp -> sp.shorthand.equals(it, true) }
                        ?.name
                    return@also
                }

                school = null
            }
        }

        if (major != null && school != null) {
            major = schoolsData
                .singleOrNull { it.name == school }
                ?.majors
                ?.find { it.equals(major, true) }
        }
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

        class ProfileVerifier : Verifier<Profile>() {
            override suspend fun VerificationScope<Profile>.rules() {
                Profile::name {
                    lengthIn(1..64, "Name must be between 1 and 64 characters.")
                    matches(nameRegex, "Invalid characters in name.")
                }

                check(Profile::classes) {
                    if (value != null && value.isNotEmpty()) {
                        val normalized = value.map { it.trim() }
                        val invalid = normalized.filterNot(::isValidUmnClass)
                        if (invalid.isNotEmpty()) {
                            errorIf(true, "Invalid UMN class codes: ${invalid.joinToString(", ")}.")
                        }
                    }
                }

                check(Profile::gradYear) {
                    errorIf("Invalid graduation year.") { it != null && it !in 2020..2035 }
                }

                check(Profile::school) {
                    if (value != null) {
                        val valid = value.lowercase() in validSchools ||
                            value.lowercase() in validShorthands
                        errorIf(!valid, "Invalid school.")
                    }
                }

                check(Profile::major) {
                    if (value != null) {
                        errorIf(
                            instance.school == null,
                            "To pick a major, you must have already chosen a school."
                        )

                        if (instance.school != null) {
                            errorIf(value.lowercase() !in validMajors, "Invalid major.")

                            val majorInSchool = schoolsData
                                .singleOrNull { it.name == instance.school }
                                ?.majors
                                ?.any { it.equals(value, true) } ?: false

                            errorIf(!majorInSchool, "That major is not in that school.")
                        }
                    }
                }

                check(Profile::bio) {
                    errorIf("Bio must be under 512 characters.") { it != null && it.length > 512 }
                }

                check(Profile::instagram) {
                    if (value != null) {
                        errorIf(
                            value.isBlank() || value.length > 32,
                            "Instagram handle must be between 1 and 32 characters."
                        )
                        errorIf(!value.startsWith("@"), "Instagram handle must start with '@'.")
                        errorIf(!instaRegex.matches(value), "Instagram handle contains invalid characters.")
                    }
                }

                check(Profile::linkedIn) {
                    if (value != null) {
                        errorIf(
                            value.isBlank() || value.length > 64,
                            "LinkedIn username must be between 1 and 64 characters."
                        )
                        errorIf(
                            !linkedInRegex.matches(value.removePrefix("/in/")),
                            "LinkedIn username contains invalid characters."
                        )
                    }
                }

                check(Profile::phoneNumber) {
                    errorIf("Invalid phone number format.") {
                        it != null && !phoneRegex.matches(it)
                    }
                }
            }
        }

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
                badges = row[alias[Profiles.badges]],
            )
    }
}

/** Get a user's profile by their [userID]. */
suspend fun getProfile(userID: String): Profile? = query {
    Profiles.selectAll().where { Profiles.userID eq userID }.singleOrNull()?.toEntity(Profiles)
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
