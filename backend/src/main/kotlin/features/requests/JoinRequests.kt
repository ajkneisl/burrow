package app.burrow.features.requests

import app.burrow.features.account.Users
import app.burrow.features.invites.InviteType
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table for storing join requests to burrows or clubs. */
object JoinRequests : Table("join_requests") {
    /** [JoinRequest.requestType] */
    val requestType =
        enumerationByName("request_type", 16, InviteType::class)
            .default(InviteType.BURROW)
            .index("ix_requests_type")

    /** [JoinRequest.targetID] */
    val targetID =
        varchar("target_id", 64)
            .index("ix_requests_target")

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

    override val primaryKey = PrimaryKey(targetID, requestType, requesterID)

    init {
        index("ix_requests_target_status", false, targetID, requestType, status)
        index("ix_requests_requester_status", false, requesterID, status)
        uniqueIndex("uq_requests_target_requester", targetID, requestType, requesterID, status)
    }
}
