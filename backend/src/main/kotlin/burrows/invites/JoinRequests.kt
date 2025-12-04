package app.burrow.burrows.invites

import app.burrow.account.models.Users
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table for storing burrow join requests. */
object JoinRequests : Table("join_requests") {
    /** [JoinRequest.burrowID] */
    val burrowID =
        reference("burrow_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_requests_burrow")

    /** [JoinRequest.requesterID] */
    val requesterID =
        reference("requester_id", Users.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_requests_requester")

    /** [JoinRequest.status] */
    val status =
        enumerationByName("status", 16, JoinRequestStatus::class)
            .default(JoinRequestStatus.PENDING)
            .index("ix_requests_status")

    /** [JoinRequest.createdAt] */
    val createdAt = long("created_at")

    /** [JoinRequest.reviewedAt] */
    val reviewedAt = long("reviewed_at").nullable()

    /** [JoinRequest.reviewedBy] */
    val reviewedBy =
        reference("reviewed_by", Users.id, onDelete = ReferenceOption.SET_NULL).nullable()

    override val primaryKey = PrimaryKey(burrowID, requesterID)

    init {
        index("ix_requests_burrow_status", false, burrowID, status)
        index("ix_requests_requester_status", false, requesterID, status)
        uniqueIndex("uq_requests_burrow_requester", burrowID, requesterID, status)
    }
}
