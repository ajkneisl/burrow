package app.burrow.features.account

import app.burrow.admin.log.DB_LOG
import app.burrow.env
import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import java.io.File
import java.security.SecureRandom
import java.util.Date
import kotlin.io.encoding.Base64
import kotlin.system.exitProcess
import org.slf4j.LoggerFactory

/** Handles authorization through JWT and secret management. */
object Authorization {
    private val LOGGER = LoggerFactory.getLogger(this.javaClass)

    /** Generate a secure random HMAC key (64 bytes for HS512). */
    private fun generateHmacKey(): ByteArray {
        val bytes = ByteArray(64)
        SecureRandom().nextBytes(bytes)
        return bytes
    }

    /**
     * Secret for JWT.
     *
     * This initially tries `KEY_B64` environment variable, but if not set, it'll go to file. This
     * file is by default `/etc/burrow/key`, but can be overridden through the `KEY_LOCATION`
     * environment variable. If this file exists, it will be used, otherwise it will be created with
     * a random key.
     */
    private val SECRET_BYTES: ByteArray by lazy {
        // try KEY_B64 environment variable.
        env("KEY_B64")
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?.let { b64 ->
                try {
                    return@lazy Base64.decode(b64)
                } catch (ex: Exception) {
                    LOGGER.error("[FATAL] KEY_B64 is not valid Base64.", ex)
                    exitProcess(-1)
                }
            }

        // start trying file
        val keyLocation = env("KEY_LOCATION") ?: "/etc/burrow/key"
        val keyStorage = File(keyLocation)

        if (keyStorage.exists()) {
            val canRead = keyStorage.canRead()

            if (!canRead) {
                LOGGER.error("[FATAL] Invalid key file: {} (cannot read)", keyLocation)
                exitProcess(-1)
            }

            try {
                Base64.decode(keyStorage.readText().trim())
            } catch (ex: Exception) {
                LOGGER.error("[FATAL] Could not decode key file at {}", keyStorage.absolutePath, ex)

                exitProcess(-1)
            }
        } else if (keyStorage.createNewFile()) {
            val keyBytes = generateHmacKey()
            val encodedKey = Base64.encode(keyBytes)

            // try to make it a bit more secure
            try {
                keyStorage.setReadable(false, false)
                keyStorage.setWritable(false, false)
                keyStorage.setExecutable(false, false)
                keyStorage.setReadable(true, true)
                keyStorage.setWritable(true, true)
            } catch (_: Throwable) {
                /* empty */
            }

            keyStorage.writeText(encodedKey)

            LOGGER.info(
                DB_LOG,
                "Successfully generated new secret key. Stored at {}",
                keyStorage.absolutePath,
            )

            return@lazy keyBytes
        } else {
            LOGGER.error("[FATAL] Could not create key file at {}", keyStorage.absolutePath)
            exitProcess(-1)
        }
    }

    private val key = Algorithm.HMAC512(SECRET_BYTES)

    /** How long the JWT is valid for. */
    private const val VALIDITY_MS = 1000 * 60 * 60 * 24 * 3 // 3 days :)

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
    const val ADMIN_AUDIENCE = "burrow/admin"

    /** Verifier using same algorithm, audience, and issuer */
    fun getVerifier(audience: String = PUBLIC_AUDIENCE): JWTVerifier =
        JWT.require(key).withAudience(audience).withIssuer("Burrow").build()
}
