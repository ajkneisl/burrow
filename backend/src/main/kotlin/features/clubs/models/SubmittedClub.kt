package app.burrow.features.clubs.models

import app.burrow.api.Verifiable
import app.burrow.api.VerificationScope
import app.burrow.api.Verifier
import app.burrow.features.account.Users
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.models.enums.ClubCategory
import app.burrow.features.clubs.models.enums.ClubPrivacy
import app.burrow.api.query
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

@Verifiable(with = SubmittedClub.Companion.SubmittedClubVerifier::class)
@Serializable
data class SubmittedClub(
    val name: String,
    val displayName: String,
    val description: String,
    val category: ClubCategory,
    val privacy: ClubPrivacy,
    val requestToJoin: Boolean,
    val members: List<String>,
) {
    companion object {
        class SubmittedClubVerifier : Verifier<SubmittedClub>() {
            companion object {
                private val displayNameRegex = Regex("^[A-Za-z0-9_ -]+$")
                private val nameRegex = Regex("^[A-Za-z0-9-]+$")

                private const val MAX_NAME_LENGTH = 32
                private const val MAX_DISPLAY_NAME_LENGTH = 32
                private const val MAX_DESCRIPTION_LENGTH = 1024
            }

            override suspend fun VerificationScope<SubmittedClub>.rules() {
                SubmittedClub::name {
                    lengthIn(
                        1..MAX_NAME_LENGTH,
                        "Name must be between 1 and $MAX_NAME_LENGTH characters.",
                    )
                    matches(nameRegex, "Club name must only contain letters, numbers, and hyphens.")

                    val nameTaken =
                        query { Clubs.selectAll().where { Clubs.name eq value }.singleOrNull() } !=
                            null

                    errorIf(nameTaken, "Club name is already taken.")
                }

                SubmittedClub::displayName {
                    lengthIn(
                        1..MAX_DISPLAY_NAME_LENGTH,
                        "Display name must be between 1 and $MAX_DISPLAY_NAME_LENGTH characters.",
                    )
                    matches(
                        displayNameRegex,
                        "Display name can only contain letters, numbers, underscores, hyphens, and spaces.",
                    )
                }

                SubmittedClub::description {
                    maxLength(
                        MAX_DESCRIPTION_LENGTH,
                        "Description must be 1024 characters or fewer.",
                    )
                }

                SubmittedClub::members {
                    maxSize(4, "You can only invite up to 4 members.")

                    each { _, memberID ->
                        val exists =
                            query {
                                Users.selectAll().where { Users.id eq memberID }.singleOrNull()
                            } != null

                        if (!exists) "User $memberID does not exist." else null
                    }
                }
            }
        }
    }
}
