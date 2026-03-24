package app.burrow.features.clubs.members

import app.burrow.api.MappedTable
import app.burrow.features.clubs.models.enums.ClubRole
import kotlinx.serialization.Serializable

/**
 * A member of a club.
 *
 * @param userID The ID of the member.
 * @param clubID The ID that the [userID] has joined.
 * @param joinedAt When the user joined in epoch ms.
 * @param role The role of the user.
 * @param roleName The custom role name of the user.
 * @see ClubMembers
 * @see app.burrow.features.clubs.models.Club
 */
@Serializable
@MappedTable(ClubMembers::class)
data class ClubMember(
    val userID: String,
    val clubID: String,
    val joinedAt: Long,
    val role: ClubRole,
    val roleName: String,
)
