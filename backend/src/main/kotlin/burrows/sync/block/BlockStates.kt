package app.burrow.burrows.sync.block

import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Manage the state of a [Block]. */
object BlockStates : Table("block_state") {
    /** [Block.BlockState.meetingId] */
    val meetingId = reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)

    /** [Block.BlockState.block] */
    val block = varchar("block", 32)

    /** [Block.BlockState.data] */
    val data = text("data")
}
