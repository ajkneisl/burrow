package app.burrow.features.clubs

import app.burrow.features.account.models.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/**
 * The clubs table.
 *
 * @see Club
 */
object Clubs : Table("features/clubs") {
    /** [Club.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [Club.name] */
    val name = varchar("name", 64).uniqueIndex()

    /** [Club.displayName] */
    val displayName = varchar("username", 255)

    /** [Club.description] */
    val description = varchar("description", 512)

    /** [Club.category] */
    val category = enumeration<ClubCategory>("category")

    /** [Club.ownerID] */
    val ownerID = reference("owner_id", Users.id, onDelete = ReferenceOption.CASCADE).index()

    /** [Club.privacy] */
    val privacy = enumeration<ClubPrivacy>("privacy")

    /** [Club.requestToJoin] */
    val requestToJoin = bool("request_to_join")

    /** [Club.createdAt] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
