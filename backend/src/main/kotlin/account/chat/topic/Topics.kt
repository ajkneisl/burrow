package app.burrow.account.chat.topic

import app.burrow.account.models.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Topic] */
object Topics : Table("topics") {
    /** [Topic.id] */
    val id = varchar("id", 36).uniqueIndex()

    /** [Topic.name] */
    val name = varchar("name", 64)

    /** [Topic.description] */
    val description = varchar("description", 256)

    /** [Topic.createdBy] */
    val createdBy = reference("created_by", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [Topic.createdAt] */
    val createdAt = long("created_at")

    /** [Topic.pinned] */
    val pinned = bool("pinned").default(false)

    /** [Topic.expiresAt] */
    val expiresAt = long("expires_at").nullable()

    override val primaryKey = PrimaryKey(id)
}
