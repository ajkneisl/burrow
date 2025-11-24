package app.burrow.account

import org.jetbrains.exposed.v1.core.Table

/** Database table for [app.burrow.account.models.User]. */
object Users : Table("users") {
    /** [app.burrow.account.models.User.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.account.models.User.username] */
    val username = varchar("username", 255)

    /** [app.burrow.account.models.User.email] */
    val email = varchar("email", 255).uniqueIndex()

    /** [app.burrow.account.models.User.createdDate] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
