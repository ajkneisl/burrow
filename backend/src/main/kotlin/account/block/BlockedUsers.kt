package app.burrow.account.block

import app.burrow.account.models.Users
import app.burrow.query
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toSet
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

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
suspend fun blockUser(userID: String, otherUserID: String) = query {
    val exists =
        BlockedUsers.selectAll()
            .where { (BlockedUsers.blocker eq userID) and (BlockedUsers.blocked eq otherUserID) }
            .count() > 0

    if (!exists) {
        BlockedUsers.insert {
            it[blocker] = userID
            it[blocked] = otherUserID
            it[createdAt] = System.currentTimeMillis()
        }
    }
}

/** Unblock [blockedUserID] as [userID]. */
suspend fun unBlockUser(userID: String, blockedUserID: String) = query {
    BlockedUsers.deleteWhere {
        (BlockedUsers.blocker eq userID) and (BlockedUsers.blocked eq blockedUserID)
    }
}
