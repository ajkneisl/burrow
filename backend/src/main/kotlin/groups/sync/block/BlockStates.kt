package app.burrow.groups.sync.block

import app.burrow.groups.Meetings
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

/** Manage the state of a [Block]. */
object BlockStates : Table("block_state") {
    val meetingId = reference("meeting_id", Meetings.id, onDelete = ReferenceOption.CASCADE)
    val block = varchar("block", 32)
    val data = text("data")
}
