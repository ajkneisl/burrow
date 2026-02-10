package app.burrow.features.clubs.members

import app.burrow.features.account.Users
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.clubs.Clubs
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

object ClubMembers : Table("club_members") {
    val clubID = reference("club_id", Clubs.id, onDelete = ReferenceOption.CASCADE)
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val joinedAt = long("joined_at")
    val role = enumeration<ClubRole>("role")
    val roleName = varchar("role_name", 32)
}
