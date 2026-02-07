package app.burrow.features.burrows.sync.block

import app.burrow.features.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Manage the state of a [Block]. */
object BlockStates : Table("block_state") {
    /** [Block.BlockState.burrowID] */
    val burrowID = reference("burrow_id", Burrows.id, onDelete = ReferenceOption.CASCADE)

    /** [Block.BlockState.blockID] */
    val blockID = varchar("block", 32)

    /** [Block.BlockState.data] */
    val data = text("data")

    init {
        uniqueIndex(blockID, burrowID)
    }
}
