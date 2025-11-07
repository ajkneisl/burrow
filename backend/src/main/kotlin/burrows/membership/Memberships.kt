package app.burrow.burrows.membership

import app.burrow.account.Users
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Membership] */
object Memberships : Table("memberships") {
    /** [Membership.meetingID] */
    val meetingID =
        reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
            .index("ix_membership_meetingID")

    /** [Membership.userID] */
    val userID =
        reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE).index("ix_membership_userID")

    /** [Membership.role] */
    val role = enumerationByName("role", 32, BurrowRole::class).default(BurrowRole.MEMBER)

    /** [Membership.status] */
    val status =
        enumerationByName("status", 16, BurrowMemberStatus::class)
            .default(BurrowMemberStatus.JOINED)

    /** [Membership.joinedAt] */
    val joinedAt = long("joined_at")

    /** [Membership.leftAt] */
    val leftAt = long("left_at").nullable()

    override val primaryKey = PrimaryKey(meetingID, userID, name = "pk_membership")

    init {
        index("ix_membership_meetingID_userID", false, meetingID, userID)
    }
}
