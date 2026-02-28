package app.burrow.features.account.models

import app.burrow.api.Error
import app.burrow.api.InvalidAuthorization
import app.burrow.api.MappedTable
import app.burrow.api.NotFound
import app.burrow.api.photo.deletePhoto
import app.burrow.api.query
import app.burrow.api.toEntity
import app.burrow.env
import app.burrow.features.account.Authorization
import app.burrow.features.account.Users
import app.burrow.features.account.getAllBlockedRelationships
import app.burrow.features.account.profile.Following
import app.burrow.features.account.profile.Profiles
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.forms.submitForm
import io.ktor.http.parameters
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.notInList
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import org.slf4j.LoggerFactory

/** Logger for user operations. */
private val LOGGER = LoggerFactory.getLogger("User")

/** HTTP client for OAuth token exchange */
private val httpClient =
    HttpClient(CIO) { install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) } }

/** Android OAuth client ID */
private val ANDROID_CLIENT_ID =
    env("GOOGLE_CLIENT_ID_ANDROID")
        ?: "808386876282-kcf8lq37gn0q6o5mrha6krcf5vlf2uru.apps.googleusercontent.com"

/**
 * Exchange an authorization code for an ID token using Google's token endpoint. Used for Android
 * OAuth flow where the client sends the auth code to the backend.
 *
 * @param code The authorization code from Google OAuth
 * @param codeVerifier The PKCE code verifier used in the authorization request
 * @param redirectUri The redirect URI used in the authorization request
 * @return The ID token string
 * @throws Exception if token exchange fails
 */
suspend fun exchangeCodeForIdToken(
    code: String,
    codeVerifier: String,
    redirectUri: String,
): String {
    val response =
        httpClient.submitForm(
            url = "https://oauth2.googleapis.com/token",
            formParameters =
                parameters {
                    append("code", code)
                    append("client_id", ANDROID_CLIENT_ID)
                    append("redirect_uri", redirectUri)
                    append("grant_type", "authorization_code")
                    append("code_verifier", codeVerifier)
                },
        )

    val tokenData = response.body<JsonObject>()

    val idToken = tokenData["id_token"]?.jsonPrimitive?.content
    if (idToken == null) {
        val error =
            tokenData["error_description"]?.jsonPrimitive?.content
                ?: tokenData["error"]?.jsonPrimitive?.content
                ?: "Unknown error"
        LOGGER.error("Failed to exchange code for token: {}", error)
        throw Exception("Token exchange failed: $error")
    }

    return idToken
}

/**
 * Google ID token verifier for validating OAuth tokens locally. This verifier automatically fetches
 * and caches Google's public keys.
 */
private val googleVerifier: GoogleIdTokenVerifier? by lazy {
    val clientId = env("GOOGLE_CLIENT_ID")
    val iosClientId = env("GOOGLE_CLIENT_ID_IOS")

    if (clientId.isNullOrBlank() || iosClientId.isNullOrBlank()) {
        LOGGER.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID_IOS environment variable is not set.")
        null
    } else {
        GoogleIdTokenVerifier.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(listOf(clientId, iosClientId, ANDROID_CLIENT_ID))
            .build()
    }
}

/**
 * A Burrow user.
 *
 * @param id The user's Google ID
 * @param username The user's selected name.
 * @param email The user's email.
 * @param createdAt The date the account was created.
 */
@Serializable
@MappedTable(Users::class)
data class User(
    val id: String,
    val username: String,
    @Transient val email: String = "",
    val createdAt: Long,
)

/**
 * Using a Google JWT token, verify that they have the proper domain then either create an account
 * or create a login token.
 *
 * @param token Authorized Google JWT ID token
 * @return AuthorizedUser if validation succeeds
 * @throws app.burrow.api.ServerError If there's an issue.
 */
suspend fun retrieveUser(token: String): AuthorizedUser? {
    val idToken: GoogleIdToken = googleVerifier?.verify(token) ?: throw InvalidAuthorization()

    val payload: GoogleIdToken.Payload = idToken.payload

    // verify they have a UMN id
    val hostedDomain = payload.hostedDomain
    if (hostedDomain != "umn.edu")
        throw Error(400, "You must use a University of Minnesota Google account.")

    val googleID = payload.subject
    val email = payload.email
    val name = payload["name"] as? String

    if (googleID == null || email == null || name == null)
        throw Error(
            500,
            "There was an issue with Google. Please report this through support@umn.app",
        )

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

        return AuthorizedUser(
            User(id = googleID, username = username, email = email, createdAt = createdDate),
            true,
            Authorization.generateToken(googleID),
        )
    } else {
        // existing user
        return AuthorizedUser(
            User(
                id = googleID,
                username = user[Users.username],
                email = user[Users.email],
                createdAt = user[Users.createdAt],
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
 * @throws Error If the user doesn't exist.
 */
suspend fun getUserByID(userID: String): User =
    query { Users.selectAll().where { Users.id eq userID }.firstOrNull() }?.toEntity(Users)
        ?: throw NotFound()

/**
 * Get a user by their username.
 *
 * @param username The username of the user.
 */
suspend fun getUserByUsername(username: String): User =
    query { Users.selectAll().where { Users.username eq username }.firstOrNull() }?.toEntity(Users)
        ?: throw NotFound()

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
 * Search for users by username or profile name. Returns up to 10 results ranked by relevance:
 * exact username match > prefix match > contains match, with friends boosted within each tier.
 *
 * @param searchQuery The search query to match against username and profile name.
 * @param requestingUserID The user searching.
 * @param excludeRequestor If [requestingUserID] should be excluded
 * @return A list of up to 10 matching users, ranked by relevance.
 */
suspend fun searchUsers(
    searchQuery: String,
    requestingUserID: String?,
    excludeRequestor: Boolean,
): List<UserSearchResult> {
    if (searchQuery.isBlank()) return emptyList()

    val trimmed = searchQuery.trim().lowercase()
    val escaped = trimmed.replace("%", "\\%").replace("_", "\\_")
    val containsPattern = "%${escaped}%"

    val blockedUserIds =
        if (requestingUserID != null) getAllBlockedRelationships(requestingUserID) else emptySet()

    val friendIds: Set<String> = if (requestingUserID != null) {
        query {
            val following = Following.select(Following.followee)
                .where { Following.follower eq requestingUserID }
                .toList()
                .map { it[Following.followee] }
                .toSet()

            val followers = Following.select(Following.follower)
                .where { Following.followee eq requestingUserID }
                .toList()
                .map { it[Following.follower] }
                .toSet()

            following.intersect(followers)
        }
    } else emptySet()

    data class RankedUser(val result: UserSearchResult, val score: Int)

    return query {
        Users.leftJoin(Profiles, { Users.id }, { Profiles.userID })
            .selectAll()
            .where {
                ((Users.username.lowerCase() like containsPattern) or
                    (Profiles.name.lowerCase() like containsPattern)) and
                    (if (requestingUserID != null && excludeRequestor) Users.id neq requestingUserID else Op.TRUE) and
                    (if (blockedUserIds.isNotEmpty()) Users.id notInList blockedUserIds.toList()  else Op.TRUE)
            }
            .limit(50)
            .toList()
            .map { row ->
                val username = row[Users.username]
                val name = row.getOrNull(Profiles.name)
                val usernameLower = username.lowercase()
                val nameLower = name?.lowercase()

                // score: lower is better
                val matchScore = when {
                    usernameLower == trimmed -> 0                                       // exact username
                    nameLower == trimmed -> 1                                           // exact name
                    usernameLower.startsWith(trimmed) -> 2                              // username prefix
                    nameLower?.startsWith(trimmed) == true -> 3                         // name prefix
                    else -> 4                                                           // contains
                }

                val friendBoost = if (friendIds.contains(row[Users.id])) 0 else 10

                RankedUser(
                    result = UserSearchResult(
                        id = row[Users.id],
                        username = username,
                        name = name,
                    ),
                    score = matchScore * 100 + friendBoost
                )
            }
            .sortedBy { it.score }
            .take(10)
            .map { it.result }
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
