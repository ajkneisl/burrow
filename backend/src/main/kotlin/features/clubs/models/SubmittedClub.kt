package app.burrow.features.clubs.models

import app.burrow.features.account.Users
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.models.enums.ClubCategory
import app.burrow.features.clubs.models.enums.ClubPrivacy
import app.burrow.query
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

@Serializable
data class SubmittedClub(
    val name: String,
    val displayName: String,
    val description: String,
    val category: ClubCategory,
    val privacy: ClubPrivacy,
    val requestToJoin: Boolean,
    val members: List<String>,
)

private val displayNameRegex = Regex("^[A-Za-z0-9_ -]+$")
private val nameRegex = Regex("^[A-Za-z0-9-]+$")

private const val MAX_NAME_LENGTH = 32
private const val MAX_DISPLAY_NAME_LENGTH = 32
private const val MAX_DESCRIPTION_LENGTH = 1024

/**
 * Verify that the [SubmittedClub] is valid.
 *
 * @param userID The user who's attempting to submit the club.
 * @return A list of errors with the submission. If the submission is OK, this list will be empty.
 */
suspend fun SubmittedClub.verifySubmission(userID: String): List<String> {
    val errors = mutableListOf<String>()

    // check name
    val nameTaken =
        query {
            //
            Clubs.selectAll().where { Clubs.name eq name }.singleOrNull()
        } != null

    if (nameTaken) {
        errors.add("Club name is already taken.")
    }

    if (name.length !in 1..MAX_NAME_LENGTH) {
        errors.add("Name must be between 1 and $MAX_NAME_LENGTH characters.")
    }

    if (!nameRegex.matches(name)) {
        errors.add("Club name must only contain letters, numbers, and hyphens.")
    }

    // validate display name
    if (displayName.length !in 1..MAX_DISPLAY_NAME_LENGTH) {
        errors.add("Display name must be between 1 and $MAX_DISPLAY_NAME_LENGTH characters.")
    }

    if (!displayNameRegex.matches(displayName)) {
        errors.add(
            "Display name can only contain letters, numbers, underscores, hyphens, and spaces."
        )
    }

    // validate description
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        errors.add("Description must be 1024 characters or fewer.")
    }

    // validate members
    if (members.size > 4) {
        errors.add("You can only invite up to 4 members.")
    }

    // verify all member IDs are valid users
    for (memberID in members) {
        val exists =
            query { Users.selectAll().where { Users.id eq memberID }.singleOrNull() } != null

        if (!exists) errors.add("User $memberID does not exist.")
    }

    return errors
}
