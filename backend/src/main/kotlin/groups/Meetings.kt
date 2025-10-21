package app.burrow.groups

import app.burrow.account.Users
import app.burrow.groups.models.GroupType
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** A meeting. */
object Meetings : Table("group_meetings") {
    val id = varchar("id", 64).uniqueIndex()
    val owner = reference("owner", Users.id, onDelete = ReferenceOption.CASCADE)

    val title = varchar("title", 255)
    val description = text("description")
    val location = varchar("location", 255)
    val kind = enumerationByName("kind", 32, GroupType::class)
    val beginningTime = long("beginning_time")
    val endTime = long("end_time")
    val tags = text("tags")
    val creationDate = long("creation_date")
    val capacity = integer("capacity")

    override val primaryKey = PrimaryKey(id)
}