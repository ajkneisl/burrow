package app.burrow.features.account.models

import kotlinx.serialization.Serializable

/**
 * An authorized user.
 *
 * @param user The user data.
 * @param newUser If this user just registered.
 * @param token An authorization token.
 */
@Serializable data class AuthorizedUser(val user: User, val newUser: Boolean, val token: String)
