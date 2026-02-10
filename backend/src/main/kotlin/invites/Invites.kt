package app.burrow.invites

import app.burrow.features.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table for storing invitations to burrows or clubs. */
object Invites : Table("burrow_invites") {
    /** [Invite.inviteType] */
    val inviteType =
        enumerationByName("invite_type", 16, InviteType::class)
            .default(InviteType.BURROW)
            .index("ix_invites_type")

    /** [Invite.targetID] */
    val targetID =
        varchar("target_id", 64)
            .index("ix_invites_target")

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

    override val primaryKey = PrimaryKey(targetID, inviteType, inviterID, inviteeID)

    init {
        index("ix_invites_target_status", false, targetID, inviteType, status)
        index("ix_invites_invitee_status", false, inviteeID, status)
        uniqueIndex("uq_invites_target_invitee", targetID, inviteType, inviteeID, status)
    }
}
