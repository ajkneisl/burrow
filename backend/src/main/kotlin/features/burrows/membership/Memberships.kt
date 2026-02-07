package app.burrow.features.burrows.membership

import app.burrow.features.account.models.Users
import app.burrow.features.burrows.models.BurrowMemberStatus
import app.burrow.features.burrows.models.BurrowRole
import app.burrow.features.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Membership] */
object Memberships : Table("memberships") {
    /** [Membership.burrowID] */
    val burrowID = reference("burrow_id", Burrows.id, onDelete = ReferenceOption.CASCADE).index()

    /** [Membership.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE).index()

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

    override val primaryKey = PrimaryKey(burrowID, userID)
}
