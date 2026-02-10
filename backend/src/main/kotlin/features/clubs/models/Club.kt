package app.burrow.features.clubs.models

import app.burrow.MappedTable
import app.burrow.features.clubs.models.enums.ClubCategory
import app.burrow.features.clubs.models.enums.ClubPrivacy
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.clubs.Clubs
import app.burrow.features.clubs.members.ClubMembers
import app.burrow.features.invites.InviteType
import app.burrow.features.invites.createInvite
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.update

/** A club. */
@Serializable
@MappedTable(Clubs::class)
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
)