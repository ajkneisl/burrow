package app.burrow.features.account.models

import kotlinx.serialization.Serializable

/** The type of a [User]'s account. */
@Serializable
enum class AccountType {
    /** A regular user. */
    USER,

    /** An administrator with access to the admin panel. */
    ADMIN,
}
