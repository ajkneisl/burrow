package app.burrow.account.models

import app.burrow.account.Authorization
import app.burrow.account.Users
import app.burrow.account.profile.Profiles
import app.burrow.errors.ServerError
import app.burrow.query
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * A Burrow user.
 *
 * @param id The user's Google ID
 * @param username The user's selected name.
 * @param email The user's email.
 * @param phoneNumber The user's phone number.
 * @param createdDate The date the account was created.
 */
@Serializable
data class User(
    val id: String,
    val username: String,
    val email: String,
    val phoneNumber: String,
    val createdDate: Long,
) {
    companion object {
        /**
         * Form a [User] from a [row].
         *
         * @param row A row containing a user.
         */
        fun fromRow(row: ResultRow): User =
            User(
                row[Users.id],
                row[Users.username],
                row[Users.email],
                row[Users.phoneNumber],
                row[Users.createdDate],
            )
    }
}

private val client =
    HttpClient(CIO) { install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) } }

/**
 * Using a Google JWT token, verify that they have te proper domain then either create an account or
 * create a login token.
 *
 * @param token Authorized Google JWT
 */
suspend fun retrieveUser(token: String): AuthorizedUser? {
    // TODO verify locally
    val resp = client.get("https://oauth2.googleapis.com/tokeninfo?id_token=${token}").bodyAsText()

    val json = Json.parseToJsonElement(resp).jsonObject
    val hd = json["hd"]

    if (hd == null || hd.jsonPrimitive.content != "umn.edu") {
        // not apart of UMN, no no
        return null
    }

    val googleID = json["sub"]?.jsonPrimitive?.content
    val name = json["name"]?.jsonPrimitive?.content
    val email = json["email"]?.jsonPrimitive?.content

    if (googleID == null || name == null || email == null) {
        return null
    }

    val user = query { Users.selectAll().where { Users.id eq googleID }.singleOrNull() }

    // user does not exist
    if (user == null) {
        val createdDate = getTimeMillis()

        query {
            Users.insert {
                it[Users.username] = email.removeSuffix("@umn.edu")
                it[Users.email] = email
                it[Users.phoneNumber] = ""
                it[Users.createdDate] = createdDate
                it[Users.id] = googleID
            }
        }

        query {
            Profiles.insert {
                it[Profiles.userID] = googleID
                it[Profiles.name] = name
            }
        }

        return AuthorizedUser(
            User(
                id = googleID,
                username = name,
                email = email,
                phoneNumber = "",
                createdDate = createdDate,
            ),
            true,
            Authorization.generateToken(googleID),
        )
    } else {
        return AuthorizedUser(
            User(
                id = googleID,
                username = user[Users.username],
                email = user[Users.email],
                phoneNumber = user[Users.phoneNumber],
                createdDate = user[Users.createdDate],
            ),
            false,
            Authorization.generateToken(googleID),
        )
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
 * @throws ServerError If the user doesn't exist.
 */
suspend fun getUserByID(userID: String): User {
    val user =
        query { Users.selectAll().where { Users.id eq userID }.firstOrNull() }
            ?: throw ServerError(401, "Invalid user ID.")

    return User.fromRow(user)
}

/**
 * Get a user by their username.
 *
 * @param username The username of the user.
 */
suspend fun getUserByUsername(username: String): User {
    val user =
        query { Users.selectAll().where { Users.username eq username }.firstOrNull() }
            ?: throw ServerError(401, "Invalid username.")

    return User.fromRow(user)
}

val ApplicationCall.userID
    get() = principal<JWTPrincipal>()?.subject ?: throw ServerError(401, "Invalid token.")

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
            throw ServerError(400, "Username must be between 3 and 32 characters.")

        // proper characters
        !usernameRegex.matches(username) ->
            throw ServerError(
                400,
                "You may only use uppercase and lowercase letters, numbers, underscores, and hyphens.",
            )

        // uniqueness
        query { Users.selectAll().where { Users.username eq username }.firstOrNull() } != null ->
            throw ServerError(400, "This username is already taken!")
    }
}
