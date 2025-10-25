package app.burrow.account.models

import app.burrow.ServerError
import app.burrow.account.Authorization
import app.burrow.account.Users
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
import kotlin.system.exitProcess
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
 * @param name The user's selected name.
 * @param email The user's email.
 * @param phoneNumber The user's phone number.
 * @param createdDate The date the account was created.
 */
@Serializable
data class User(
    val id: String,
    val name: String,
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
                row[Users.name],
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
                it[Users.name] = name
                it[Users.email] = email
                it[Users.phoneNumber] = ""
                it[Users.createdDate] = createdDate
                it[Users.id] = googleID
            }
        }

        return AuthorizedUser(
            User(
                id = googleID,
                name = name,
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
                name = user[Users.name],
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
 * Update an attribute on a [User].
 *
 * @param id The ID of the user.
 * @param key The field to update.
 * @param value The value to update the [key] to.
 */
suspend fun updateUser(id: String, key: String, value: String) {
    query {
        Users.update({ Users.id eq id }) {
            when (key) {
                "name" -> it[Users.name] = value
                "phone" -> it[Users.phoneNumber] = value
            }
        }
    }
}

/**
 * Get a user by their ID.
 *
 * @param id The ID of the user.
 * @throws ServerError If the user doesn't exist.
 */
suspend fun getUser(id: String): User {
    val user =
        query {
            try {
                Users.selectAll().where { Users.id eq id }.firstOrNull()
            } catch (ex: Exception) {
                ex.printStackTrace()
                exitProcess(-1)
            }
        } ?: throw ServerError(401, "Invalid user ID.")

    return User.fromRow(user)
}

/** Get a user's ID from an authorized token from the call. */
fun ApplicationCall.requireUserID(): String {
    return this.userID ?: throw ServerError(401, "Invalid token.")
}

val ApplicationCall.userID
    get() = principal<JWTPrincipal>()?.subject

/** Get a user's object from an authorized token from the call. */
suspend fun ApplicationCall.authorizedUser(): User {
    val token = requireUserID()

    return getUser(token)
}
