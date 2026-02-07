package app.burrow.features.clubs.members

import app.burrow.features.clubs.ClubRole
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow

@Serializable
data class ClubMember(
    val userID: String,
    val clubID: String,
    val joinedAt: Long,
    val role: ClubRole,
    val roleText: String,
) {
    companion object {
        fun fromRow(row: ResultRow) =
            ClubMember(
                userID = row[ClubMembers.userID],
                clubID = row[ClubMembers.clubID],
                joinedAt = row[ClubMembers.joinedAt],
                role = row[ClubMembers.role],
                roleText = row[ClubMembers.roleName],
            )
    }
}
