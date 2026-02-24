package app.burrow.features.account.alt

import app.burrow.features.account.Authorization
import app.burrow.features.account.models.AuthorizedUser
import app.burrow.features.account.models.User
import app.burrow.features.account.Users
import app.burrow.features.account.profile.Profiles
import app.burrow.api.query
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.mindrot.jbcrypt.BCrypt

/**
 * An alternative account. This is for users who are not at the University who need special access
 * to Burrow.
 *
 * @param username The user-specified username to the account.
 * @param password The user-specified password to the account.
 * @param creationDate When the account was created.
 */
@Serializable
data class AlternativeAccount(
    val username: String,
    @Transient val password: String = "",
    val creationDate: Long,
)

/**
 * Attempt to login using the provided [username] and [password].
 *
 * @return The token for the account or `null` if there's a user provided issue along the way (like:
 *   wrong pw/user)
 */
suspend fun login(username: String, password: String): AuthorizedUser? = query {
    val accountRow =
        AlternativeAccounts.selectAll()
            .where { AlternativeAccounts.username eq username }
            .singleOrNull() ?: return@query null

    return@query if (BCrypt.checkpw(password, accountRow[AlternativeAccounts.password])) {
        AuthorizedUser(
            User(
                id = username,
                username = username,
                email = "temporary@umn.app",
                createdAt = accountRow[AlternativeAccounts.creationDate],
            ),
            true,
            Authorization.generateToken(username),
        )
    } else {
        null
    }
}

/**
 * Create an alternative account with a specified [username] and [password].
 *
 * This creates a regular account with the googleID as [username] and an email with an `@umn.app`
 * ending. This is not intended for anyone but people testing out the platform.
 */
suspend fun createAlternativeAccount(username: String, password: String): AlternativeAccount =
    query {
        val createdAt = getTimeMillis()
        val hashedPw = BCrypt.hashpw(password, BCrypt.gensalt())

        AlternativeAccounts.insert {
            it[AlternativeAccounts.username] = username
            it[AlternativeAccounts.password] = hashedPw
            it[AlternativeAccounts.creationDate] = createdAt
        }

        Users.insert {
            it[Users.username] = username
            it[Users.email] = "$username@umn.app"
            it[Users.createdAt] = createdAt
            it[Users.id] = username
        }

        Profiles.insert {
            it[Profiles.userID] = username
            it[Profiles.name] = username
        }

        AlternativeAccount(username, hashedPw, createdAt)
    }
