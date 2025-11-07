package app.burrow.burrows.sync.block

import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Manage the state of a [Block]. */
object BlockStates : Table("block_state") {
    val meetingId = reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
    val block = varchar("block", 32)
    val data = text("data")
}
