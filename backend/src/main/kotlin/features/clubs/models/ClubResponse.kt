package app.burrow.features.clubs.models

import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.members.ClubMember
import app.burrow.features.clubs.members.ClubMembers
import app.burrow.features.clubs.members.getClubMembership
import app.burrow.features.invites.InviteType
import app.burrow.features.requests.JoinRequestStatus
import app.burrow.features.requests.getJoinRequest
import app.burrow.query
import app.burrow.toEntity
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** API response for a club. */
@Serializable
data class ClubResponse(
    val club: Club,
    val membership: ClubMember?,
    val memberCount: Long,
    val requestedToJoin: Boolean?,
)

/**
 * Build a [ClubResponse] for a club by name.
 *
 * @param clubName The unique name of the club.
 * @param requestingUserID The ID of the user requesting the data.
 */
suspend fun getClubResponse(clubName: String, requestingUserID: String?): ClubResponse? {
    val club =
        query {
            Clubs.selectAll()
                .where { Clubs.name eq clubName }
                .singleOrNull()
                ?.toEntity<Club>(Clubs)
        } ?: return null

    val clubID = club.id

    val memberCount = query {
        ClubMembers.selectAll().where { ClubMembers.clubID eq clubID }.count()
    }

    if (requestingUserID.isNullOrBlank()) {
        return ClubResponse(
            club = club,
            membership = null,
            memberCount = memberCount,
            requestedToJoin = null,
        )
    }

    val membership = getClubMembership(requestingUserID, clubID)

    val requestedToJoin =
        if (membership == null) {
            getJoinRequest(requestingUserID, clubID, InviteType.CLUB)?.status ==
                JoinRequestStatus.PENDING
        } else null

    return ClubResponse(
        club = club,
        membership = membership,
        memberCount = memberCount,
        requestedToJoin = requestedToJoin,
    )
}
