package app.burrow.features.account.models

import org.jetbrains.exposed.v1.core.Table

/** Database table for [User]. */
object Users : Table("users") {
    /** [User.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [User.username] */
    val username = varchar("username", 255)

    /** [User.email] */
    val email = varchar("email", 255).uniqueIndex()

    /** [User.createdDate] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}