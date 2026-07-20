package app.burrow.features.account

import app.burrow.api.Error
import app.burrow.env
import app.burrow.features.account.models.AccountType
import app.burrow.features.account.models.getUserByID
import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.Application
import io.ktor.server.auth.authentication
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
import java.util.Date
import kotlin.io.encoding.Base64
import kotlin.system.exitProcess
import org.slf4j.LoggerFactory

/** Handles authorization through JWT and secret management. */
object Authorization {
    private val LOGGER = LoggerFactory.getLogger(this.javaClass)

    /** Secret for JWT. */
    private val SECRET_BYTES: ByteArray by lazy {
        // try KEY_B64 environment variable.
        val key =
            env("KEY")
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
                ?.let { b64 ->
                    try {
                        Base64.decode(b64)
                    } catch (_: Exception) {
                        null
                    }
                }

        if (key == null) {
            LOGGER.error("[FATAL] KEY is not valid.")
            exitProcess(-1)
        }

        return@lazy key
    }

    private val key = Algorithm.HMAC512(SECRET_BYTES)

    /** How long the JWT is valid for. */
    private const val VALIDITY_MS = 1000 * 60 * 15 // 15 minutes

    /** Generate a token for an ID */
    fun generateToken(id: String, audience: String = PUBLIC_AUDIENCE): String {
        return JWT.create()
            .withSubject(id)
            .withIssuer("Burrow")
            .withAudience(audience)
            .withExpiresAt(Date(System.currentTimeMillis() + VALIDITY_MS))
            .sign(key)
    }

    const val PUBLIC_AUDIENCE = "burrow/general"

    /** Verifier using same algorithm, audience, and issuer */
    fun getVerifier(audience: String = PUBLIC_AUDIENCE): JWTVerifier =
        JWT.require(key).withAudience(audience).withIssuer("Burrow").build()

    const val PRIMARY_AUTH = "primary"
    const val ADMIN_AUTH = "administrator"

    fun Application.configureAuthentication() {
        authentication {
            // PRIMARY
            // this is for all regular account stuff
            // this is accessible by anyone with a
            // regular account
            jwt(PRIMARY_AUTH) {
                realm = "burrow"
                verifier(getVerifier())

                challenge { _, _ -> throw Error(401, "Token is invalid or expired.") }
                validate { credential ->
                    if (credential.payload.audience.contains(PUBLIC_AUDIENCE))
                        JWTPrincipal(credential.payload)
                    else null
                }
            }

            // ADMINISTRATOR
            // for all administrator actions, uses the
            // same account as PRIMARY but requires the
            // user's account type to be ADMIN
            jwt(ADMIN_AUTH) {
                realm = "burrow/administrator"
                verifier(getVerifier())

                challenge { _, _ -> throw Error(401, "Token is invalid or expired.") }
                validate { credential ->
                    val subject = credential.payload.subject

                    if (!credential.payload.audience.contains(PUBLIC_AUDIENCE) || subject == null)
                        return@validate null

                    val user = runCatching { getUserByID(subject) }.getOrNull()

                    if (user?.accountType == AccountType.ADMIN) JWTPrincipal(credential.payload)
                    else null
                }
            }
        }
    }
}
