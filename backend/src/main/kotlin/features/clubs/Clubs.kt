package app.burrow.features.clubs

import app.burrow.features.account.Users
import app.burrow.features.clubs.models.enums.ClubCategory
import app.burrow.features.clubs.models.enums.ClubPrivacy
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/**
 * Table representing Clubs.
 *
 * @see app.burrow.features.clubs.models.Club
 */
object Clubs : Table("clubs") {
    /** [app.burrow.features.clubs.models.Club.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.features.clubs.models.Club.name] */
    val name = varchar("name", 64).uniqueIndex()

    /** [app.burrow.features.clubs.models.Club.displayName] */
    val displayName = varchar("display_name", 255)

    /** [app.burrow.features.clubs.models.Club.description] */
    val description = varchar("description", 1024).nullable()

    /** [app.burrow.features.clubs.models.Club.category] */
    val category = enumeration<ClubCategory>("category")

    /** [Clubs.links] */
    val links = text("links").default("{}")

    /** [app.burrow.features.clubs.models.Club.ownerID] */
    val ownerID = reference("owner_id", Users.id, onDelete = ReferenceOption.CASCADE).index()

    /** [app.burrow.features.clubs.models.Club.privacy] */
    val privacy = enumeration<ClubPrivacy>("privacy")

    /** [app.burrow.features.clubs.models.Club.requestToJoin] */
    val requestToJoin = bool("request_to_join")

    /** [app.burrow.features.clubs.models.Club.createdAt] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
