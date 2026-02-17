package app.burrow.features.account

import app.burrow.features.account.Users
import app.burrow.features.account.profile.Profiles
import app.burrow.features.account.profile.unFollowUser
import app.burrow.features.burrows.membership.Memberships
import app.burrow.features.burrows.models.enums.BurrowMemberStatus
import app.burrow.features.burrows.models.enums.BurrowRole
import app.burrow.features.burrows.Burrows
import app.burrow.features.notifications.Notifications
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.flow.toSet
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** Users who a are blocked. */
object BlockedUsers : Table("blocked_users") {
    val blocker = reference("blocker_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val blocked = reference("blocked_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(blocker, blocked)
}

/** Find the ID of the users that [userID] has blocked. */
suspend fun getBlockedUsers(userID: String): Set<String> = query {
    BlockedUsers.selectAll()
        .where { BlockedUsers.blocker eq userID }
        .map { it[BlockedUsers.blocked] }
        .toSet()
}

/**
 * Info about a blocked user.
 *
 * @param userID The blocked user's ID.
 * @param username The blocked user's username.
 * @param name The blocked user's display name.
 * @param blockedAt When the user was blocked.
 */
@Serializable
data class BlockedUserInfo(
    val userID: String,
    val username: String,
    val name: String,
    val blockedAt: Long,
)

/** Get detailed info about all users that [userID] has blocked. */
suspend fun getBlockedUsersWithDetails(userID: String): List<BlockedUserInfo> = query {
    val blockedData = BlockedUsers.selectAll()
        .where { BlockedUsers.blocker eq userID }
        .toList()

    if (blockedData.isEmpty()) return@query emptyList()

    val blockedIds = blockedData.map { it[BlockedUsers.blocked] }
    val blockedAtMap = blockedData.associate { it[BlockedUsers.blocked] to it[BlockedUsers.createdAt] }

    Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
        .select(Users.id, Users.username, Profiles.name)
        .where { Users.id inList blockedIds }
        .toList()
        .map { row ->
            BlockedUserInfo(
                userID = row[Users.id],
                username = row[Users.username],
                name = row[Profiles.name],
                blockedAt = blockedAtMap[row[Users.id]] ?: 0L,
            )
        }
        .sortedByDescending { it.blockedAt }
}

/** Find the ID of users who have blocked [userID]. */
suspend fun getUsersWhoBlocked(userID: String): Set<String> = query {
    BlockedUsers.selectAll()
        .where { BlockedUsers.blocked eq userID }
        .map { it[BlockedUsers.blocker] }
        .toSet()
}

/** Get all users involved in a block relationship with [userID] (either direction). */
suspend fun getAllBlockedRelationships(userID: String): Set<String> =
    getBlockedUsers(userID) + getUsersWhoBlocked(userID)

/** Check if [otherUserID] is blocked by [userID]. */
suspend fun isBlockedBy(userID: String, otherUserID: String): Boolean =
    getBlockedUsers(userID).contains(otherUserID)

/** Block [otherUserID] as [userID]. */
suspend fun blockUser(userID: String, otherUserID: String) {
    // remove any follow relationship in both directions
    unFollowUser(userID, otherUserID)
    unFollowUser(otherUserID, userID)

    // leave all burrows hosted by the blocked user
    leaveBurrowsHostedBy(userID, otherUserID)

    query {
        val exists =
            BlockedUsers.selectAll()
                .where {
                    (BlockedUsers.blocker eq userID) and (BlockedUsers.blocked eq otherUserID)
                }
                .count() > 0

        if (!exists) {
            BlockedUsers.insert {
                it[blocker] = userID
                it[blocked] = otherUserID
                it[createdAt] = System.currentTimeMillis()
            }
        }
    }
}

/** Leave all still-active burrows that [hostUserID] is hosting where [userID] is a member. */
private suspend fun leaveBurrowsHostedBy(userID: String, hostUserID: String) = query {
    val currentTime = getTimeMillis()

    // find all active burrow IDs hosted by hostUserID where user is a joined non-host member
    val activeBurrowIds =
        Burrows.innerJoin(Memberships, { Burrows.id }, { Memberships.burrowID })
            .select(Burrows.id)
            .where {
                (Burrows.ownerID eq hostUserID) and
                    (Burrows.endTime greater currentTime) and
                    (Memberships.userID eq userID) and
                    (Memberships.status eq BurrowMemberStatus.JOINED) and
                    (Memberships.role neq BurrowRole.HOST)
            }
            .map { it[Burrows.id] }
            .toSet()

    if (activeBurrowIds.isEmpty()) return@query

    // directly update membership status to LEFT
    Memberships.update(
        where = {
            (Memberships.userID eq userID) and (Memberships.burrowID inList activeBurrowIds)
        }
    ) {
        it[role] = BurrowRole.MEMBER
        it[status] = BurrowMemberStatus.LEFT
        it[leftAt] = currentTime
    }

    // clear notifications for these burrows
    Notifications.deleteWhere {
        (Notifications.userID eq userID) and (Notifications.burrowID inList activeBurrowIds)
    }
}

/** Unblock [blockedUserID] as [userID]. */
suspend fun unBlockUser(userID: String, blockedUserID: String) = query {
    BlockedUsers.deleteWhere {
        (BlockedUsers.blocker eq userID) and (BlockedUsers.blocked eq blockedUserID)
    }
}
