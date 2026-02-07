package app.burrow.features.clubs

import app.burrow.features.account.models.Users
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.clubs.members.ClubMember
import app.burrow.features.clubs.members.ClubMembers
import app.burrow.features.clubs.members.getClubMembership
import app.burrow.features.invites.InviteType
import app.burrow.features.requests.JoinRequestStatus
import app.burrow.features.requests.getJoinRequest
import app.burrow.query
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** API response for a club. */
@Serializable
data class ClubResponse(
    val club: Club,
    val ownerUsername: String,
    val ownerProfile: Profile?,
    val membership: ClubMember?,
    val memberCount: Long,
    val requestedToJoin: Boolean?,
)

/**
 * Build a [ClubResponse] for a club.
 *
 * @param clubID The ID of the club.
 * @param requestingUserID The ID of the user requesting the data.
 */
suspend fun getClubResponse(clubID: String, requestingUserID: String?): ClubResponse? {
    val clubData = query {
        Clubs.innerJoin(Users, { Clubs.ownerID }, { Users.id })
            .innerJoin(Profiles, { Clubs.ownerID }, { Profiles.userID })
            .selectAll()
            .where { Clubs.id eq clubID }
            .singleOrNull()
            ?.let { row ->
                Triple(Club.fromRow(row), row[Users.username], Profile.fromRow(row))
            }
    } ?: return null

    val (club, ownerUsername, ownerProfile) = clubData

    val memberCount = query {
        ClubMembers.selectAll()
            .where { ClubMembers.clubID eq clubID }
            .count()
    }

    if (requestingUserID.isNullOrBlank()) {
        return ClubResponse(
            club = club,
            ownerUsername = ownerUsername,
            ownerProfile = ownerProfile,
            membership = null,
            memberCount = memberCount,
            requestedToJoin = null,
        )
    }

    val membership = getClubMembership(requestingUserID, clubID)

    val requestedToJoin = if (membership == null) {
        getJoinRequest(requestingUserID, clubID, InviteType.CLUB)?.status == JoinRequestStatus.PENDING
    } else null

    return ClubResponse(
        club = club,
        ownerUsername = ownerUsername,
        ownerProfile = ownerProfile,
        membership = membership,
        memberCount = memberCount,
        requestedToJoin = requestedToJoin,
    )
}
