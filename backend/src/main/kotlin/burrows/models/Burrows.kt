package app.burrow.burrows.models

import app.burrow.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [app.burrow.burrows.Burrow] */
object Burrows : Table("group_meetings") {
    /** [app.burrow.burrows.Burrow.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.burrows.Burrow.ownerID] */
    val ownerID =
        reference("owner", Users.id, onDelete = ReferenceOption.CASCADE).index("ix_burrows_owner")

    /** [app.burrow.burrows.Burrow.title] */
    val title = varchar("title", 255)

    /** [app.burrow.burrows.Burrow.description] */
    val description = text("description")

    /** [app.burrow.burrows.Burrow.location] */
    val location = varchar("location", 255)

    /** [app.burrow.burrows.Burrow.kind] */
    val kind = enumerationByName("kind", 32, BurrowType::class).index("ix_burrows_kind")

    /** [app.burrow.burrows.Burrow.beginningTime] */
    val beginningTime = long("beginning_time").index("ix_burrows_beginning_time")

    /** [app.burrow.burrows.Burrow.endTime] */
    val endTime = long("end_time").index("ix_burrows_end_time")

    /** [app.burrow.burrows.Burrow.tags] */
    val tags = text("tags")

    /** [app.burrow.burrows.Burrow.creationDate] */
    val creationDate = long("creation_date")

    /** [app.burrow.burrows.Burrow.capacity] */
    val capacity = integer("capacity")

    /** [app.burrow.burrows.Burrow.visibility] */
    val visibility =
        enumerationByName<BurrowVisibility>("visibility", 32)
            .index("ix_burrows_visibility")
            .default(BurrowVisibility.PUBLIC)

    override val primaryKey = PrimaryKey(id)

    init {
        index("ix_burrows_kind_visibility_beginning", false, kind, visibility, beginningTime)
        index("ix_burrows_owner_visibility_beginning", false, ownerID, visibility, beginningTime)
    }
}
