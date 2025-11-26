package app.burrow.burrows.models

import app.burrow.account.models.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [app.burrow.burrows.Burrow] */
object Burrows : Table("burrows") {
    /** [app.burrow.burrows.Burrow.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.burrows.Burrow.ownerID] */
    val ownerID = reference("owner_id", Users.id, onDelete = ReferenceOption.CASCADE).index()

    /** [app.burrow.burrows.Burrow.title] */
    val title = varchar("title", 255)

    /** [app.burrow.burrows.Burrow.description] */
    val description = text("description")

    /** [app.burrow.burrows.Burrow.location] */
    val location = varchar("location", 255)

    /** [app.burrow.burrows.Burrow.kind] */
    val kind = enumerationByName("kind", 32, BurrowKind::class).index()

    /** [app.burrow.burrows.Burrow.beginningTime] */
    val beginningTime = long("beginning_time").index()

    /** [app.burrow.burrows.Burrow.endTime] */
    val endTime = long("end_time").index()

    /** [app.burrow.burrows.Burrow.tags] */
    val tags = text("tags")

    /** [app.burrow.burrows.Burrow.creationDate] */
    val creationDate = long("creation_date")

    /** [app.burrow.burrows.Burrow.capacity] */
    val capacity = integer("capacity")

    /** [app.burrow.burrows.Burrow.visibility] */
    val visibility =
        enumerationByName<BurrowVisibility>("visibility", 32)
            .index()
            .default(BurrowVisibility.PUBLIC)

    /** [app.burrow.burrows.Burrow.requestToJoin] */
    val requestToJoin = bool("request_to_join").default(false)

    override val primaryKey = PrimaryKey(id)

    init {
        index(false, kind, visibility, beginningTime)
        index(false, ownerID, visibility, beginningTime)
    }
}
