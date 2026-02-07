package app.burrow.features.clubs

import app.burrow.features.invites.InviteType
import app.burrow.features.invites.createInvite
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.update

/** A club. */
@Serializable
data class Club(
    /** The unique ID of the club. */
    val id: String,

    /** The owner ID. */
    val ownerID: String,

    /** The name of the club. (used for URL etc) */
    val name: String,

    /** The displayed name of the club. */
    val displayName: String,

    /** The description of the club. */
    val description: String,

    /** The category of club. */
    val category: ClubCategory,

    /** How the club appears on the discover page. */
    val privacy: ClubPrivacy,

    /** If you must request to become a club member. */
    val requestToJoin: Boolean,

    /** When the club was created. */
    val createdAt: Long,
) {
    companion object {
        fun fromRow(row: ResultRow) =
            Club(
                id = row[Clubs.id],
                ownerID = row[Clubs.ownerID],
                name = row[Clubs.name],
                displayName = row[Clubs.displayName],
                description = row[Clubs.description],
                category = row[Clubs.category],
                privacy = row[Clubs.privacy],
                requestToJoin = row[Clubs.requestToJoin],
                createdAt = row[Clubs.createdAt],
            )
    }
}

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
suspend fun deleteClub(clubID: String) = query {
    Clubs.deleteWhere { Clubs.id eq clubID }
}
