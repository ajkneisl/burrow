package app.burrow.account

import org.jetbrains.exposed.v1.core.Table

/** Database table for [app.burrow.features.account.User]. */
object Users : Table("users") {
    // TODO: change table name to "id"
    val id = varchar("google_id", 64).uniqueIndex()
    val name = varchar("name", 255)
    val email = varchar("email", 255).uniqueIndex()
    val phoneNumber = varchar("phone_number", 32)
    val createdDate = long("created_date")

    override val primaryKey = PrimaryKey(id)
}
