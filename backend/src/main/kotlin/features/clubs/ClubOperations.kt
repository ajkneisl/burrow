package app.burrow.features.clubs

import app.burrow.features.clubs.members.ClubMembers
import app.burrow.features.clubs.models.Club
import app.burrow.features.clubs.models.SubmittedClub
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.invites.InviteType
import app.burrow.features.invites.createInvite
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.update
import java.util.UUID

/**
 * Create a club from a [submittedClub].
 *
 * @param ownerID The user creating the club.
 * @param submittedClub The submitted club data.
 * @return The created [Club].
 */
suspend fun createClub(ownerID: String, submittedClub: SubmittedClub): Club {
    val id = UUID.randomUUID().toString()
    val createdAt = getTimeMillis()

    query {
        Clubs.insert {
            it[Clubs.id] = id
            it[Clubs.name] = submittedClub.name
            it[Clubs.displayName] = submittedClub.displayName
            it[Clubs.description] = submittedClub.description
            it[Clubs.category] = submittedClub.category
            it[Clubs.ownerID] = ownerID
            it[Clubs.privacy] = submittedClub.privacy
            it[Clubs.requestToJoin] = submittedClub.requestToJoin
            it[Clubs.createdAt] = createdAt
        }
    }

    val club =
        Club(
            id = id,
            ownerID = ownerID,
            name = submittedClub.name,
            displayName = submittedClub.displayName,
            description = submittedClub.description,
            category = submittedClub.category,
            privacy = submittedClub.privacy,
            requestToJoin = submittedClub.requestToJoin,
            createdAt = createdAt,
        )

    // Insert the owner as an administrator
    query {
        ClubMembers.insert {
            it[ClubMembers.userID] = ownerID
            it[ClubMembers.clubID] = id
            it[ClubMembers.joinedAt] = createdAt
            it[ClubMembers.role] = ClubRole.ADMINISTRATOR
            it[ClubMembers.roleName] = "Owner"
        }
    }

    submittedClub.members.forEach { memberID ->
        createInvite(ownerID, memberID, id, InviteType.CLUB)
    }

    return club
}

/**
 * Update a club.
 *
 * @param clubID The ID of the club to update.
 * @param submittedClub The updated club data.
 */
suspend fun updateClub(clubID: String, submittedClub: SubmittedClub) = query {
    Clubs.update({ Clubs.id eq clubID }) {
        it[Clubs.name] = submittedClub.name
        it[Clubs.displayName] = submittedClub.displayName
        it[Clubs.description] = submittedClub.description
        it[Clubs.category] = submittedClub.category
        it[Clubs.privacy] = submittedClub.privacy
        it[Clubs.requestToJoin] = submittedClub.requestToJoin
    }
}

/**
 * Delete a club.
 *
 * @param clubID The ID of the club to delete.
 */
suspend fun deleteClub(clubID: String) = query { Clubs.deleteWhere { Clubs.id eq clubID } }