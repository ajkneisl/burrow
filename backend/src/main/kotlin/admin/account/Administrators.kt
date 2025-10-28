package app.burrow.admin.account

import app.burrow.errors.ServerError
import app.burrow.account.Authorization
import app.burrow.admin.account.TOTP.secretGenerator
import app.burrow.groups.sync.chat.ChatMessage
import app.burrow.query
import dev.samstevens.totp.code.CodeGenerator
import dev.samstevens.totp.code.CodeVerifier
import dev.samstevens.totp.code.DefaultCodeGenerator
import dev.samstevens.totp.code.DefaultCodeVerifier
import dev.samstevens.totp.secret.DefaultSecretGenerator
import dev.samstevens.totp.secret.SecretGenerator
import dev.samstevens.totp.time.SystemTimeProvider
import dev.samstevens.totp.time.TimeProvider
import io.ktor.util.date.*
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.single
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.UUIDTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import org.mindrot.jbcrypt.BCrypt

object Administrators : UUIDTable("administrators") {
    val username = varchar("username", 64).uniqueIndex()
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val permissionBits = long("permission_bits")
    val createdAt = long("created_at")
    val lastLoginAt = long("last_login_at").nullable()
    val lastLoginIp = varchar("last_login_ip", 64).nullable()
    val failedLoginAttempts = integer("failed_login_attempts").default(0)
    val lockedUntil = long("locked_until").nullable()
    val twoFactorSecret = varchar("two_factor_secret", 64).nullable()
    val passwordUpdatedAt = long("password_updated_at")
}

@Serializable
data class Administrator(
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val id: UUID,
    val username: String,
    val email: String,
    @Transient val passwordHash: String = "",
    val permissionBits: Long,
    val createdAt: Long,
    val lastLoginAt: Long?,
    val lastLoginIp: String?,
    @Transient val failedLoginAttempts: Int = 0,
    @Transient val lockedUntil: Long? = null,
    @Transient val twoFactorSecret: String? = null,
    val passwordUpdatedAt: Long,
) {
    companion object {
        fun fromRow(row: ResultRow): Administrator =
            Administrator(
                id = row[Administrators.id].value,
                username = row[Administrators.username],
                email = row[Administrators.email],
                passwordHash = row[Administrators.passwordHash],
                permissionBits = row[Administrators.permissionBits],
                createdAt = row[Administrators.createdAt],
                lastLoginAt = row[Administrators.lastLoginAt],
                lastLoginIp = row[Administrators.lastLoginIp],
                failedLoginAttempts = row[Administrators.failedLoginAttempts],
                lockedUntil = row[Administrators.lockedUntil],
                twoFactorSecret = row[Administrators.twoFactorSecret],
                passwordUpdatedAt = row[Administrators.passwordUpdatedAt],
            )
    }
}

object TOTP {
    val timeProvider: TimeProvider = SystemTimeProvider()
    val codeGenerator: CodeGenerator = DefaultCodeGenerator()
    val verifier: CodeVerifier = DefaultCodeVerifier(codeGenerator, timeProvider)
    val secretGenerator: SecretGenerator = DefaultSecretGenerator()

    fun validate(secret: String, code: String) = verifier.isValidCode(secret, code)
}

private const val ACCOUNT_LOCK_THRESHOLD = 5
private const val ACCOUNT_LOCK_DURATION = 1000 * 60 * 60 * 24L // 1 day

suspend fun adminLogin(
    username: String,
    password: String,
    totp: String?,
): Pair<String, Administrator> {
    val now = getTimeMillis()
    val row =
        query {
            Administrators.selectAll().where { Administrators.username eq username }.singleOrNull()
        } ?: throw ServerError(401, "Invalid username or password.")

    val id = row[Administrators.id].value
    val lockedUntil = row[Administrators.lockedUntil]

    if (lockedUntil != null && now < lockedUntil) {
        throw ServerError(401, "Account locked. Try again later.")
    }

    val passwordHash = row[Administrators.passwordHash]
    val passwordOk =
        try {
            BCrypt.checkpw(password, passwordHash)
        } catch (_: Exception) {
            false
        }

    // check for TOTP or password
    val secret = row[Administrators.twoFactorSecret]
    if (!passwordOk || (secret != null && (totp.isNullOrBlank() || !TOTP.validate(secret, totp)))) {
        val current = row[Administrators.failedLoginAttempts]
        val next = current + 1
        val newLock =
            if (next >= ACCOUNT_LOCK_THRESHOLD) now + ACCOUNT_LOCK_DURATION else lockedUntil

        query {
            Administrators.update({ Administrators.id eq id }) {
                // reset failed login attempts after locking
                it[Administrators.failedLoginAttempts] = if (newLock != lockedUntil) next else 0

                it[Administrators.lockedUntil] = newLock
            }
        }

        throw ServerError(401, "Invalid username, password, or TOTP.")
    }

    // reset failed stuff and update last login date
    query {
        Administrators.update({ Administrators.username eq username }) {
            it[Administrators.failedLoginAttempts] = 0
            it[Administrators.lockedUntil] = null
            it[Administrators.lastLoginAt] = now
        }
    }

    // return administrator object
    return query {
        Authorization.generateToken(id.toString(), Authorization.ADMIN_AUDIENCE) to
            Administrators.selectAll()
                .where { Administrators.id eq id }
                .single()
                .let { Administrator.fromRow(it) }
    }
}

suspend fun createAdministrator(
    username: String,
    email: String,
    password: String,
    permissionBits: Long = 0,
): Administrator {
    val now = getTimeMillis()

    val existingByUsername = query {
        Administrators.selectAll()
            .where { (Administrators.username eq username) or (Administrators.email eq email) }
            .singleOrNull()
    }

    if (existingByUsername != null) {
        throw ServerError(409, "Username or email already exists.")
    }

    val passwordHash =
        try {
            BCrypt.hashpw(password, BCrypt.gensalt(12))
        } catch (_: Exception) {
            throw ServerError(400, "Invalid password.")
        }

    val totpSecret = secretGenerator.generate()
    val adminId = UUID.randomUUID()

    query {
        Administrators.insert {
            it[id] = adminId
            it[Administrators.username] = username
            it[Administrators.email] = email
            it[Administrators.passwordHash] = passwordHash
            it[Administrators.permissionBits] = permissionBits
            it[Administrators.createdAt] = now
            it[Administrators.passwordUpdatedAt] = now
            it[Administrators.lastLoginAt] = null
            it[Administrators.lastLoginIp] = null
            it[Administrators.failedLoginAttempts] = 0
            it[Administrators.lockedUntil] = null
            it[Administrators.twoFactorSecret] = totpSecret
        }
    }

    return query {
        Administrators.selectAll()
            .where { Administrators.id eq adminId }
            .single()
            .let { Administrator.fromRow(it) }
    }
}

object Permissions {
    const val VIEW_DASHBOARD = 0b1L
    const val VIEW_GROUPS = 0b10L
    const val VIEW_USERS = 0b100L
    const val MANAGE_GROUPS = 0b1000L
    const val MANAGE_USERS = 0b10000L
    const val VIEW_ADMIN_USERS = 0b100000L
    const val MANAGE_ADMIN_USERS = 0b1000000L
    const val MANAGE_NOTIFICATIONS = 0b10000000L
}

/**
 * Require the [Administrator] to have the given [permissions].
 *
 * @see Permissions
 */
fun Administrator.requirePermissions(vararg permissions: Long) {
    val hasAll = permissions.all { permission -> (permissionBits and permission) == permission }

    if (!hasAll) {
        throw ServerError(403, "Missing required permissions.")
    }
}

/**
 * Retrieve a single administrator by ID.
 *
 * @param id Administrator UUID string
 * @return Administrator or null if not found
 */
suspend fun getAdministrator(id: String): Administrator? {
    return query {
        Administrators.selectAll()
            .where { Administrators.id eq UUID.fromString(id) }
            .singleOrNull()
            ?.let { Administrator.fromRow(it) }
    }
}

/**
 * Retrieve all administrators in the system.
 *
 * @return List of Administrator objects
 */
suspend fun getAllAdministrators(): List<Administrator> {
    return query { Administrators.selectAll().map { Administrator.fromRow(it) }.toList() }
}
