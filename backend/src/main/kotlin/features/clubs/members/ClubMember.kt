package app.burrow.features.clubs.members

import app.burrow.MappedTable
import app.burrow.features.clubs.models.enums.ClubRole
import kotlinx.serialization.Serializable

@Serializable
@MappedTable(ClubMembers::class)
data class ClubMember(
    val userID: String,
    val clubID: String,
    val joinedAt: Long,
    val role: ClubRole,
    val roleName: String,
)
