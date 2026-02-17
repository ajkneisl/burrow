package app.burrow.features.burrows

import app.burrow.features.account.Users
import app.burrow.features.burrows.models.enums.BurrowKind
import app.burrow.features.burrows.models.enums.BurrowVisibility
import app.burrow.features.clubs.Clubs
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [app.burrow.features.burrows.models.Burrow] */
object Burrows : Table("burrows") {
    /** [app.burrow.features.burrows.models.Burrow.id] */
    val id = varchar("id", 64).uniqueIndex()

    /** [app.burrow.features.burrows.models.Burrow.ownerID] */
    val ownerID = reference("owner_id", Users.id, onDelete = ReferenceOption.CASCADE).index()

    /** [app.burrow.features.burrows.models.Burrow.clubID] */
    val clubID = optReference("club_id", Clubs.id, onDelete = ReferenceOption.SET_NULL).index()

    /** [app.burrow.features.burrows.models.Burrow.title] */
    val title = varchar("title", 255)

    /** [app.burrow.features.burrows.models.Burrow.description] */
    val description = text("description")

    /** [app.burrow.features.burrows.models.Burrow.location] */
    val location = varchar("location", 255)

    /** [app.burrow.features.burrows.models.Burrow.kind] */
    val kind = enumerationByName("kind", 32, BurrowKind::class).index()

    /** [app.burrow.features.burrows.models.Burrow.beginningTime] */
    val beginningTime = long("beginning_time").index()

    /** [app.burrow.features.burrows.models.Burrow.endTime] */
    val endTime = long("end_time").index()

    /** [app.burrow.features.burrows.models.Burrow.tags] */
    val tags = array<String>("tags")

    /** [app.burrow.features.burrows.models.Burrow.creationDate] */
    val creationDate = long("creation_date")

    /** [app.burrow.features.burrows.models.Burrow.capacity] */
    val capacity = integer("capacity")

    /** [app.burrow.features.burrows.models.Burrow.visibility] */
    val visibility =
        enumerationByName<BurrowVisibility>("visibility", 32)
            .index()
            .default(BurrowVisibility.PUBLIC)

    /** [app.burrow.features.burrows.models.Burrow.requestToJoin] */
    val requestToJoin = bool("request_to_join").default(false)

    /** [app.burrow.features.burrows.models.Burrow.reoccurring] */
    val reoccurring = integer("reoccurring").default(NOT_REOCCURRING)

    override val primaryKey = PrimaryKey(id)

    init {
        index(false, kind, visibility, beginningTime)
        index(false, ownerID, visibility, beginningTime)
    }
}