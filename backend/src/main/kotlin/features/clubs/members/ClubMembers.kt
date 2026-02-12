package app.burrow.features.clubs.members

import app.burrow.features.account.Users
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.models.enums.ClubRole
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Table of [ClubMember]. */
object ClubMembers : Table("club_members") {
    /** [ClubMember.clubID] */
    val clubID = reference("club_id", Clubs.id, onDelete = ReferenceOption.CASCADE)

    /** [ClubMember.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [ClubMember.joinedAt] */
    val joinedAt = long("joined_at")

    /** [ClubMember.role] */
    val role = enumeration<ClubRole>("role")

    /** [ClubMember.roleName] */
    val roleName = varchar("role_name", 32)
}
