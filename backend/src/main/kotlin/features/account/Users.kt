package app.burrow.features.account

import org.jetbrains.exposed.v1.core.Table

/** Database table for [app.burrow.features.account.models.User]. */
object Users : Table("users") {
    /** [app.burrow.features.account.models.User.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.features.account.models.User.username] */
    val username = varchar("username", 255)

    /** [app.burrow.features.account.models.User.email] */
    val email = varchar("email", 255).uniqueIndex()

    /** [app.burrow.features.account.models.User.createdAt] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}