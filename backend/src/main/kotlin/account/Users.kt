package app.burrow.account

import org.jetbrains.exposed.v1.core.Table

/** Database table for [app.burrow.account.models.User]. */
object Users : Table("users") {
    /** [app.burrow.account.models.User.id] */
    val id = varchar("google_id", 64).uniqueIndex()

    /** [app.burrow.account.models.User.username] */
    val username = varchar("name", 255)

    /** [app.burrow.account.models.User.email] */
    val email = varchar("email", 255).uniqueIndex()

    /** [app.burrow.account.models.User.phoneNumber] */
    val phoneNumber = varchar("phone_number", 32)

    /** [app.burrow.account.models.User.createdDate] */
    val createdDate = long("created_date")

    override val primaryKey = PrimaryKey(id)
}
