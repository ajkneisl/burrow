package app.burrow.features.burrows.models

import app.burrow.features.account.models.Users
import app.burrow.features.burrows.NOT_REOCCURRING
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [app.burrow.features.burrows.Burrow] */
object Burrows : Table("burrows") {
    /** [app.burrow.features.burrows.Burrow.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.features.burrows.Burrow.ownerID] */
    val ownerID = reference("owner_id", Users.id, onDelete = ReferenceOption.CASCADE).index()

    /** [app.burrow.features.burrows.Burrow.title] */
    val title = varchar("title", 255)

    /** [app.burrow.features.burrows.Burrow.description] */
    val description = text("description")

    /** [app.burrow.features.burrows.Burrow.location] */
    val location = varchar("location", 255)

    /** [app.burrow.features.burrows.Burrow.kind] */
    val kind = enumerationByName("kind", 32, BurrowKind::class).index()

    /** [app.burrow.features.burrows.Burrow.beginningTime] */
    val beginningTime = long("beginning_time").index()

    /** [app.burrow.features.burrows.Burrow.endTime] */
    val endTime = long("end_time").index()

    /** [app.burrow.features.burrows.Burrow.tags] */
    val tags = array<String>("tags")

    /** [app.burrow.features.burrows.Burrow.creationDate] */
    val creationDate = long("creation_date")

    /** [app.burrow.features.burrows.Burrow.capacity] */
    val capacity = integer("capacity")

    /** [app.burrow.features.burrows.Burrow.visibility] */
    val visibility =
        enumerationByName<BurrowVisibility>("visibility", 32)
            .index()
            .default(BurrowVisibility.PUBLIC)

    /** [app.burrow.features.burrows.Burrow.requestToJoin] */
    val requestToJoin = bool("request_to_join").default(false)

    /** [app.burrow.features.burrows.Burrow.reoccurring] */
    val reoccurring = integer("reoccurring").default(NOT_REOCCURRING)

    override val primaryKey = PrimaryKey(id)

    init {
        index(false, kind, visibility, beginningTime)
        index(false, ownerID, visibility, beginningTime)
    }
}
