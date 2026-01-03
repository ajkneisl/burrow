package app.burrow.account.models

import app.burrow.Error
import app.burrow.NotFound
import app.burrow.account.Authorization
import app.burrow.account.profile.Profiles
import app.burrow.photo.deletePhoto
import app.burrow.query
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import org.slf4j.LoggerFactory

/** Logger for user operations. */
private val LOGGER = LoggerFactory.getLogger("User")

/**
 * Google ID token verifier for validating OAuth tokens locally. This verifier automatically fetches
 * and caches Google's public keys.
 */
private val googleVerifier: GoogleIdTokenVerifier? by lazy {
    val clientId = System.getenv("GOOGLE_CLIENT_ID")

    if (clientId.isNullOrBlank()) {
        LOGGER.error("GOOGLE_CLIENT_ID environment variable is not set.")
        null
    } else {
        GoogleIdTokenVerifier.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(listOf(clientId))
            .build()
    }
}

/**
 * A Burrow user.
 *
 * @param id The user's Google ID
 * @param username The user's selected name.
 * @param email The user's email.
 * @param createdDate The date the account was created.
 */
@Serializable
data class User(
    val id: String,
    val username: String,
    @Transient val email: String = "",
    val createdDate: Long,
) {
    companion object {
        /**
         * Form a [User] from a [row].
         *
         * @param row A row containing a user.
         */
        fun fromRow(row: ResultRow): User =
            User(row[Users.id], row[Users.username], row[Users.email], row[Users.createdAt])
    }
}

/**
 * Using a Google JWT token, verify that they have the proper domain then either create an account
 * or create a login token.
 *
 * @param token Authorized Google JWT ID token
 * @return AuthorizedUser if validation succeeds, null otherwise
 */
suspend fun retrieveUser(token: String): AuthorizedUser? {
    return try {
        val idToken: GoogleIdToken? = googleVerifier?.verify(token)

        if (idToken == null) {
            LOGGER.warn("Invalid Google ID token received")
            return null
        }

        val payload: GoogleIdToken.Payload = idToken.payload

        // verify they have a UMN id
        val hostedDomain = payload.hostedDomain
        if (hostedDomain != "umn.edu") {
            LOGGER.warn("Invalid hosted domain: {}", hostedDomain ?: "null")
            return null
        }

        val googleID = payload.subject
        val email = payload.email
        val name = payload["name"] as? String

        if (googleID == null || email == null || name == null) {
            LOGGER.warn("Missing required fields in token payload")
            return null
        }

        val user = query { Users.selectAll().where { Users.id eq googleID }.singleOrNull() }

        // user does not exist - create new account
        if (user == null) {
            val createdDate = getTimeMillis()
            val username = email.removeSuffix("@umn.edu")

            query {
                Users.insert {
                    it[Users.username] = username
                    it[Users.email] = email
                    it[Users.createdAt] = createdDate
                    it[Users.id] = googleID
                }

                Profiles.insert {
                    it[Profiles.userID] = googleID
                    it[Profiles.name] = name
                }
            }

            LOGGER.info("Created new user account for {}", email)

            AuthorizedUser(
                User(id = googleID, username = username, email = email, createdDate = createdDate),
                true,
                Authorization.generateToken(googleID),
            )
        } else {
            // existing user
            AuthorizedUser(
                User(
                    id = googleID,
                    username = user[Users.username],
                    email = user[Users.email],
                    createdDate = user[Users.createdAt],
                ),
                false,
                Authorization.generateToken(googleID),
            )
        }
    } catch (e: Exception) {
        LOGGER.error("Error validating Google ID token", e)
        null
    }
}

/**
 * Update a user's username. This assumes the username is OK.
 *
 * @param userID The ID of the user.
 * @param newUsername The new username for the user.
 */
suspend fun updateUsername(userID: String, newUsername: String) {
    query { Users.update({ Users.id eq userID }) { it[Users.username] = newUsername } }
}

/**
 * Get a user by their ID.
 *
 * @param userID The ID of the user.
 * @throws Error If the user doesn't exist.
 */
suspend fun getUserByID(userID: String): User =
    query {
            // get by user ID
            Users.selectAll().where { Users.id eq userID }.firstOrNull()
        }
        ?.let { User.fromRow(it) } ?: throw NotFound()

/**
 * Get a user by their username.
 *
 * @param username The username of the user.
 */
suspend fun getUserByUsername(username: String): User =
    query {
            // get by username
            Users.selectAll().where { Users.username eq username }.firstOrNull()
        }
        ?.let { User.fromRow(it) } ?: throw NotFound()

/**
 * Search result for user search containing user ID, username, and profile name.
 *
 * @param id The user's ID.
 * @param username The user's username.
 * @param name The user's profile name (if available).
 */
@Serializable
data class UserSearchResult(val id: String, val username: String, val name: String? = null)

/**
 * Search for users by username or profile name. Returns up to 10 results that match the query.
 *
 * @param query The search query to match against username and profile name.
 * @param requestingUserID If included, do not include the requesting user.
 * @return A list of up to 10 matching users.
 */
suspend fun searchUsers(searchQuery: String, requestingUserID: String?): List<UserSearchResult> {
    if (searchQuery.isBlank()) return emptyList()

    val pattern = "%${searchQuery.trim().lowercase().replace("%", "\\%").replace("_", "\\_")}%"

    return query {
        Users.leftJoin(Profiles, { Users.id }, { Profiles.userID })
            .selectAll()
            .where {
                ((Users.username.lowerCase() like pattern) or
                    (Profiles.name.lowerCase() like pattern)) and
                    // exclude requesting user if included
                    (if (requestingUserID != null) Users.id neq requestingUserID else Op.TRUE)
            }
            .limit(10)
            .toList()
            .map { row ->
                UserSearchResult(
                    id = row[Users.id],
                    username = row[Users.username],
                    name = row.getOrNull(Profiles.name),
                )
            }
    }
}

val ApplicationCall.userID
    get() = principal<JWTPrincipal>()?.subject ?: throw Error(401, "Invalid token.")

/** Get a user's object from an authorized token from the call. */
suspend fun ApplicationCall.authorizedUser(): User {
    return getUserByID(userID)
}

/** The allowed characters in a username: letters, digits, underscores, and hyphens. */
private val usernameRegex = Regex("^[A-Za-z0-9_-]+$")

/**
 * Validate a given username to ensure:
 * - It doesn't exist.
 * - It fits the proper regex.
 * - Within length.
 *
 * @param username The username to check.
 */
suspend fun validateUsername(username: String) {
    when {
        // ensure in range
        username.length !in 3..32 ->
            throw Error(400, "Username must be between 3 and 32 characters.")

        // proper characters
        !usernameRegex.matches(username) ->
            throw Error(
                400,
                "You may only use uppercase and lowercase letters, numbers, underscores, and hyphens.",
            )

        // uniqueness
        query { Users.selectAll().where { Users.username eq username }.firstOrNull() } != null ->
            throw Error(400, "This username is already taken!")
    }
}

/**
 * Delete a user.
 *
 * @param userID The user to delete.
 */
suspend fun deleteUser(userID: String) {
    query { Users.deleteWhere { Users.id eq userID } }

    // delete photo if it exists
    try {
        deletePhoto("avatars", "user/${userID}/avatar")
    } catch (_: Exception) {
        /* empty */
    }
}
