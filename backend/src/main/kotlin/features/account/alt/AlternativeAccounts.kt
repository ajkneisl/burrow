package app.burrow.features.account.alt

import org.jetbrains.exposed.v1.core.Table

/** An alternative account. */
object AlternativeAccounts : Table("altaccounts") {
    /** [AlternativeAccount.username] */
    val username = varchar("username", 32)

    /** [AlternativeAccount.password] */
    val password = varchar("password", 128)

    /** [AlternativeAccount.creationDate] */
    val creationDate = long("creationDate")

    override val primaryKey = PrimaryKey(username)
}
