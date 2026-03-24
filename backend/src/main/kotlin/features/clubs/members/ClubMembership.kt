package app.burrow.features.clubs.members

import app.burrow.api.Error
import app.burrow.api.InvalidAuthorization
import app.burrow.api.models.PaginatedResponse
import app.burrow.features.account.Users
import app.burrow.features.account.models.User
import app.burrow.features.account.models.userID
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.models.Club
import app.burrow.features.clubs.models.enums.ClubPrivacy
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.invites.InviteType
import app.burrow.features.requests.createJoinRequest
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.server.application.ApplicationCall
import io.ktor.util.date.getTimeMillis
import kotlin.math.ceil
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** A club member with user and profile information. */
@Serializable
data class ClubMemberResponse(val member: ClubMember, val user: User, val profile: Profile)

/** A club with the requesting user's membership. */
@Serializable data class MyClubResponse(val club: Club, val membership: ClubMember)

/**
 * Get all clubs a user is a member of, sorted by role (highest first).
 *
 * @param userID The ID of the user.
 */
suspend fun getUserClubs(userID: String): List<MyClubResponse> = query {
    ClubMembers.innerJoin(Clubs, { ClubMembers.clubID }, { Clubs.id })
        .selectAll()
        .where { ClubMembers.userID eq userID }
        .toList()
        .map { row -> MyClubResponse(row.toEntity(Clubs), row.toEntity(ClubMembers)) }
        .sortedBy { it.membership.role.ordinal }
}

/**
 * Get a club by its ID.
 *
 * @param clubID The ID of the club.
 */
suspend fun getClub(clubID: String): Club? = query {
    Clubs.selectAll().where { Clubs.id eq clubID }.firstOrNull()?.toEntity()
}

/**
 * Get a club by its name.
 *
 * @param name The unique name of the club.
 */
suspend fun getClubByName(name: String): Club? = query {
    Clubs.selectAll().where { Clubs.name eq name }.firstOrNull()?.toEntity()
}

/**
 * Get a user's membership in a club.
 *
 * @param userID The ID of the user.
 * @param clubID The ID of the club.
 */
suspend fun getClubMembership(userID: String, clubID: String): ClubMember? = query {
    ClubMembers.selectAll()
        .where { (ClubMembers.userID eq userID) and (ClubMembers.clubID eq clubID) }
        .firstOrNull()
        ?.toEntity()
}

private const val MEMBERS_PAGE_SIZE = 5

/**
 * Get paginated members for a club.
 *
 * @param clubID The ID of the club.
 * @param page The page number.
 */
suspend fun getClubMembers(clubID: String, page: Int = 1): PaginatedResponse<ClubMemberResponse> =
    query {
        val baseQuery =
            ClubMembers.innerJoin(Users, { ClubMembers.userID }, { Users.id })
                .innerJoin(Profiles, { ClubMembers.userID }, { Profiles.userID })
                .selectAll()
                .where { ClubMembers.clubID eq clubID }

        val itemCount = baseQuery.count()

        val members =
            baseQuery
                .limit(MEMBERS_PAGE_SIZE)
                .offset(MEMBERS_PAGE_SIZE * (page - 1L))
                .toList()
                .map { row -> ClubMemberResponse(row.toEntity(), row.toEntity(), row.toEntity()) }

        PaginatedResponse(
            page,
            ceil(itemCount / MEMBERS_PAGE_SIZE.toDouble()).toInt(),
            itemCount,
            members,
        )
    }

/**
 * Have a user join a club.
 *
 * @param userID The ID of the user joining.
 * @param clubID The ID of the club to join.
 */
suspend fun joinClub(userID: String, clubID: String) {
    val club = getClub(clubID) ?: throw Error(404, "Club does not exist.")

    if (club.privacy == ClubPrivacy.PRIVATE) {
        throw Error(404, "Club does not exist.")
    }

    if (club.requestToJoin) {
        createJoinRequest(userID, clubID, InviteType.CLUB)
        return
    }

    val existingMember = getClubMembership(userID, clubID)
    if (existingMember != null) {
        throw Error(400, "You are already a member of this club.")
    }

    query {
        ClubMembers.insert {
            it[ClubMembers.userID] = userID
            it[ClubMembers.clubID] = clubID
            it[ClubMembers.joinedAt] = getTimeMillis()
            it[ClubMembers.role] = ClubRole.MEMBER
            it[ClubMembers.roleName] = "Member"
        }
    }
}

/**
 * Have a user leave a club.
 *
 * @param userID The ID of the user leaving.
 * @param clubID The ID of the club to leave.
 */
suspend fun leaveClub(userID: String, clubID: String) {
    val club = getClub(clubID) ?: throw Error(404, "Club does not exist.")

    if (club.ownerID == userID) {
        throw Error(400, "The owner cannot leave their own club.")
    }

    val membership =
        getClubMembership(userID, clubID) ?: throw Error(400, "You are not a member of this club.")

    if (membership.role == ClubRole.ADMINISTRATOR) {
        throw Error(400, "Administrators cannot leave. Transfer ownership first.")
    }

    query {
        ClubMembers.deleteWhere {
            (ClubMembers.userID eq userID) and (ClubMembers.clubID eq clubID)
        }
    }
}

/**
 * Change a member's role in a club.
 *
 * @param clubID The ID of the club.
 * @param userID The ID of the user whose role to change.
 * @param role The new role.
 * @param roleName The display name for the role.
 */
suspend fun changeClubRole(clubID: String, userID: String, role: ClubRole, roleName: String) {
    getClubMembership(userID, clubID) ?: throw Error(400, "User is not a member of this club.")

    query {
        ClubMembers.update({ (ClubMembers.userID eq userID) and (ClubMembers.clubID eq clubID) }) {
            it[ClubMembers.role] = role
            it[ClubMembers.roleName] = roleName
        }
    }
}

/**
 * Kick a member from a club.
 *
 * @param adminID The ID of the user performing the kick.
 * @param userID The ID of the user being kicked.
 * @param clubID The ID of the club.
 */
suspend fun kickClubMember(adminID: String, userID: String, clubID: String) {
    val club = getClub(clubID) ?: throw Error(404, "Club does not exist.")

    if (club.ownerID == userID) {
        throw Error(400, "You cannot kick the club owner.")
    }

    val adminMembership =
        getClubMembership(adminID, clubID) ?: throw Error(400, "You are not a member of this club.")

    val targetMembership =
        getClubMembership(userID, clubID) ?: throw Error(400, "User is not a member of this club.")

    // Can't kick someone with equal or higher role
    if (targetMembership.role.ordinal <= adminMembership.role.ordinal) {
        throw Error(400, "You cannot kick a member with an equal or higher role.")
    }

    query {
        ClubMembers.deleteWhere {
            (ClubMembers.userID eq userID) and (ClubMembers.clubID eq clubID)
        }
    }
}

/** Require that the authorized user is at least a moderator of [clubID]. */
suspend fun ApplicationCall.requireClubModerator(clubID: String) {
    val membership = getClubMembership(userID, clubID)
    if (membership == null || membership.role == ClubRole.MEMBER) throw InvalidAuthorization()
}

/** Require that the authorized user is an administrator of [clubID]. */
suspend fun ApplicationCall.requireClubAdmin(clubID: String) {
    val membership = getClubMembership(userID, clubID)
    if (membership == null || membership.role != ClubRole.ADMINISTRATOR)
        throw InvalidAuthorization()
}
