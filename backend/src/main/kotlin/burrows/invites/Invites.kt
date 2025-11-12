package app.burrow.burrows.invites

import app.burrow.account.Users
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table for storing burrow invitations. */
object Invites : Table("burrow_invites") {
    /** [Invite.burrowID] */
    val burrowID =
        reference("burrow_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_invites_burrow")

    /** [Invite.inviterID] */
    val inviterID =
        reference("inviter_id", Users.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_invites_inviter")

    /** [Invite.inviteeID] */
    val inviteeID =
        reference("invitee_id", Users.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_invites_invitee")

    /** [Invite.status] */
    val status =
        enumerationByName("status", 16, InviteStatus::class)
            .default(InviteStatus.PENDING)
            .index("ix_invites_status")

    /** [Invite.createdAt] */
    val createdAt = long("created_at")

    /** [Invite.respondedAt] */
    val respondedAt = long("responded_at").nullable()

    /** [Invite.expiresAt] */
    val expiresAt = long("expires_at").nullable()

    override val primaryKey = PrimaryKey(burrowID, inviterID, inviteeID)

    init {
        // Composite indexes for common queries
        index("ix_invites_burrow_status", false, burrowID, status)
        index("ix_invites_invitee_status", false, inviteeID, status)
        // Unique constraint: prevent duplicate pending invites
        uniqueIndex("uq_invites_burrow_invitee", burrowID, inviteeID, status)
    }
}
