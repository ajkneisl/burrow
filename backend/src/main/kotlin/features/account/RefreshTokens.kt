package app.burrow.features.account

import app.burrow.api.query
import io.ktor.util.date.getTimeMillis
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** Database table for refresh tokens with device tracking. */
object RefreshTokens : Table("refresh_tokens") {
    /** Unique ID for the refresh token row. */
    val id = varchar("id", 36)

    /** The user this refresh token belongs to. CASCADE delete when user is removed. */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** SHA-256 hash of the raw refresh token. The raw value is never stored. */
    val tokenHash = varchar("token_hash", 64).uniqueIndex()

    /** Human-readable device name provided by the client. */
    val deviceName = varchar("device_name", 255)

    /** When this refresh token was created. */
    val createdAt = long("created_at")

    /** When this refresh token expires. */
    val expiresAt = long("expires_at")

    override val primaryKey = PrimaryKey(id)

    init {
        index(false, userID)
    }
}

/** How long a refresh token is valid for: 90 days. */
private const val REFRESH_VALIDITY_MS = 1000L * 60 * 60 * 24 * 90

/** SHA-256 hash a raw token string to its hex representation. */
private fun sha256(input: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
    return digest.digest(input.toByteArray()).joinToString("") { "%02x".format(it) }
}

/** Generate a cryptographically random refresh token string. */
private fun generateRawToken(): String {
    val bytes = ByteArray(32)
    SecureRandom().nextBytes(bytes)
    return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
}

/**
 * Create a refresh token for a user.
 *
 * @param userID The user to create the token for.
 * @param deviceName The device name to associate with the token.
 * @return The raw refresh token string (returned to the client exactly once).
 */
suspend fun createRefreshToken(userID: String, deviceName: String): String {
    val rawToken = generateRawToken()
    val hash = sha256(rawToken)
    val now = getTimeMillis()

    query {
        RefreshTokens.insert {
            it[RefreshTokens.id] = UUID.randomUUID().toString()
            it[RefreshTokens.userID] = userID
            it[RefreshTokens.tokenHash] = hash
            it[RefreshTokens.deviceName] = deviceName
            it[RefreshTokens.createdAt] = now
            it[RefreshTokens.expiresAt] = now + REFRESH_VALIDITY_MS
        }
    }

    return rawToken
}

/**
 * Result of validating a refresh token.
 *
 * @param tokenHash The SHA-256 hash of the token (for deletion during rotation).
 * @param userID The user the token belongs to.
 * @param deviceName The device name associated with the token.
 */
data class ValidatedRefreshToken(
    val tokenHash: String,
    val userID: String,
    val deviceName: String,
)

/**
 * Validate a raw refresh token.
 *
 * @param rawToken The raw token string from the client.
 * @return The validated token info, or null if invalid/expired.
 */
suspend fun validateRefreshToken(rawToken: String): ValidatedRefreshToken? {
    val hash = sha256(rawToken)
    val now = getTimeMillis()

    return query {
        RefreshTokens.selectAll()
            .where { (RefreshTokens.tokenHash eq hash) and (RefreshTokens.expiresAt greater now) }
            .toList()
            .firstOrNull()
            ?.let {
                ValidatedRefreshToken(
                    tokenHash = it[RefreshTokens.tokenHash],
                    userID = it[RefreshTokens.userID],
                    deviceName = it[RefreshTokens.deviceName],
                )
            }
    }
}

/**
 * Delete a single refresh token by its hash.
 *
 * @param tokenHash The SHA-256 hash of the token to delete.
 */
suspend fun deleteRefreshToken(tokenHash: String) {
    query { RefreshTokens.deleteWhere { RefreshTokens.tokenHash eq tokenHash } }
}

/**
 * Delete all refresh tokens for a user.
 *
 * @param userID The user whose tokens to delete.
 */
suspend fun deleteAllRefreshTokensForUser(userID: String) {
    query { RefreshTokens.deleteWhere { RefreshTokens.userID eq userID } }
}

/**
 * Info about a refresh token session, for the session management UI.
 *
 * @param id The token row ID (for revocation).
 * @param deviceName The device name.
 * @param createdAt When the session was created.
 * @param expiresAt When the session expires.
 */
@Serializable
data class RefreshTokenInfo(
    val id: String,
    val deviceName: String,
    val createdAt: Long,
    val expiresAt: Long,
)

/**
 * Get all active refresh token sessions for a user.
 *
 * @param userID The user to get sessions for.
 * @return A list of session info objects.
 */
suspend fun getRefreshTokensForUser(userID: String): List<RefreshTokenInfo> {
    val now = getTimeMillis()

    return query {
        RefreshTokens.selectAll()
            .where { (RefreshTokens.userID eq userID) and (RefreshTokens.expiresAt greater now) }
            .toList()
            .map {
                RefreshTokenInfo(
                    id = it[RefreshTokens.id],
                    deviceName = it[RefreshTokens.deviceName],
                    createdAt = it[RefreshTokens.createdAt],
                    expiresAt = it[RefreshTokens.expiresAt],
                )
            }
    }
}

/**
 * Delete a specific refresh token by its row ID, scoped to a user.
 *
 * @param tokenId The row ID of the token to delete.
 * @param userID The user who owns the token (prevents deleting other users' tokens).
 */
suspend fun deleteRefreshTokenById(tokenId: String, userID: String) {
    query {
        RefreshTokens.deleteWhere {
            (RefreshTokens.id eq tokenId) and (RefreshTokens.userID eq userID)
        }
    }
}
