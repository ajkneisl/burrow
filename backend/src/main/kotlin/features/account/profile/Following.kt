package app.burrow.features.account.profile

import app.burrow.api.Error
import app.burrow.features.account.Users
import app.burrow.api.query
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import kotlin.math.max

object Following : Table("following") {
    val follower = reference("follower_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val followee = reference("followee_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(follower, followee)
}

/**
 * Following information about a user.
 *
 * @param following How many users they're following.
 * @param followers How many users are following.
 * @param mutuals How many mutuals the requesting user has with them.
 * @param youFollow If the requesting user is following.
 * @Param theyFollow If the requested user follows the requester.
 */
@Serializable
data class FollowResponse(
    val following: Long,
    val followers: Long,
    val mutuals: Int = 0,
    val youFollow: Boolean,
    val theyFollow: Boolean,
)

/**
 * Get a [FollowResponse] of [userID].
 *
 * @param userID The user to retrieve the following and followers for.
 * @param otherUserID Another user to find mutuals with.
 */
suspend fun getFollowing(userID: String, otherUserID: String): FollowResponse = query {
    val followingCount = Following.selectAll().where { Following.follower eq userID }.count()

    val followersCount = Following.selectAll().where { Following.followee eq userID }.count()

    val userFollowing =
        Following.select(Following.followee)
            .where { Following.follower eq userID }
            .map { it[Following.followee] }
            .toList()
            .toSet()

    val otherUserFollowing =
        Following.select(Following.followee)
            .where { Following.follower eq otherUserID }
            .map { it[Following.followee] }
            .toList()
            .toSet()

    FollowResponse(
        following = followingCount,
        followers = followersCount,
        mutuals = if (userID == otherUserID) 0 else findMutuals(userID, otherUserID),
        youFollow = otherUserFollowing.contains(userID),
        theyFollow = userFollowing.contains(otherUserID),
    )
}

/** Get all users who follow the given [userID]. */
suspend fun getFollowers(userID: String): List<String> = query {
    Following.select(Following.follower)
        .where { Following.followee eq userID }
        .map { it[Following.follower] }
        .toList()
}

/** Get all users that the given [userID] follows. */
suspend fun getFollowing(userID: String): List<String> = query {
    Following.select(Following.followee)
        .where { Following.follower eq userID }
        .map { it[Following.followee] }
        .toList()
}

/** Count how many mutual follow relationships exist between two users. */
suspend fun findMutuals(userID: String, otherUserID: String): Int = query {
    val userFollowing = getFollowing(userID)
    val otherFollowing = getFollowing(otherUserID)

    userFollowing.intersect(otherFollowing.toSet()).size
}

/**
 * A relationship between two users.
 *
 * @param userID The ID of the non-requesting user.
 * @param username The username of the non-requesting user.
 * @param name The name of the non-requesting user.
 * @param friendsAt If the two users are friends, the ms date of when these users became friends,
 *   otherwise null.
 * @param youFollowedAt When the requesting user followed.
 * @param theyFollowedAt When the requested user followed.
 */
@Serializable
data class Relation(
    val userID: String,
    val username: String,
    val name: String,
    val friendsAt: Long?,
    val youFollowedAt: Long?,
    val theyFollowedAt: Long?,
)

/**
 * Get [userID]'s friends.
 *
 * @return A list of [Relation]s that are [userID]'s friends.
 */
suspend fun getFriends(userID: String): List<Relation> = query {
    val followingMap: Map<String, Long> =
        Following.selectAll()
            .where { Following.follower eq userID }
            .map { it[Following.followee] to it[Following.createdAt] }
            .toList()
            .toMap()

    val followersMap: Map<String, Long> =
        Following.selectAll()
            .where { Following.followee eq userID }
            .map { it[Following.follower] to it[Following.createdAt] }
            .toList()
            .toMap()

    val mutualIds = followingMap.keys.intersect(followersMap.keys)
    if (mutualIds.isEmpty()) return@query emptyList()

    val userRows =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .select(Users.id, Users.username, Profiles.name)
            .where { Users.id inList mutualIds.toList() }
            .toList()

    val byId = userRows.associateBy({ it[Users.id] }, { it })

    mutualIds
        .mapNotNull { id ->
            val row = byId[id] ?: return@mapNotNull null
            val friendsAt = max(followingMap[id] ?: 0L, followersMap[id] ?: 0L)

            Relation(
                userID = id,
                username = row[Users.username],
                name = row[Profiles.name],
                friendsAt = friendsAt,
                youFollowedAt = followingMap[id],
                theyFollowedAt = followersMap[id],
            )
        }
        .sortedByDescending { it.friendsAt }
}

/** Check if [followerID] is following [followeeID]. */
suspend fun isFollowing(followerID: String, followeeID: String): Boolean = query {
    Following.selectAll()
        .where { (Following.follower eq followerID) and (Following.followee eq followeeID) }
        .count() > 0
}

/** Check if [this], which should be a user ID, and [otherUserID] are friends. */
suspend infix fun String.isFriendsWith(otherUserID: String): Boolean {
    return getFriends(this).any { relation -> relation.userID == otherUserID }
}

/** Follow a user. */
suspend fun followUser(followerID: String, followeeID: String) = query {
    if (followerID == followeeID) {
        throw Error(400, "You cannot follow yourself.")
    }

    val exists =
        Following.selectAll()
            .where { (Following.follower eq followerID) and (Following.followee eq followeeID) }
            .count() > 0

    if (!exists) {
        Following.insert {
            it[follower] = followerID
            it[followee] = followeeID
            it[createdAt] = System.currentTimeMillis()
        }
    }
}

/** Unfollow a user. */
suspend fun unFollowUser(followerID: String, followeeID: String) = query {
    Following.deleteWhere {
        (Following.follower eq followerID) and (Following.followee eq followeeID)
    }
}

/**
 * Get all follower [Relation]s of a [userID]
 *
 * @param userID The ID of the user to get the relations for.
 */
suspend fun getFollowersRelations(userID: String): List<Relation> = query {
    val followersMap: Map<String, Long> =
        Following.selectAll()
            .where { Following.followee eq userID }
            .map { it[Following.follower] to it[Following.createdAt] }
            .toList()
            .toMap()

    if (followersMap.isEmpty()) return@query emptyList()

    val userRows =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .select(Users.id, Users.username, Profiles.name)
            .where { Users.id inList followersMap.keys.toList() }
            .toList()

    val byId = userRows.associateBy({ it[Users.id] }, { it })

    followersMap.keys
        .mapNotNull { id ->
            val row = byId[id] ?: return@mapNotNull null
            val theyFollowedAt = followersMap[id] ?: 0L
            Relation(
                userID = id,
                username = row[Users.username],
                name = row[Profiles.name],
                friendsAt = theyFollowedAt,
                youFollowedAt = 0L,
                theyFollowedAt = theyFollowedAt,
            )
        }
        .sortedByDescending { it.friendsAt }
}

/**
 * Get the [Relation]s for all users that [userID] is following.
 *
 * @param userID The user to find the relations for.
 */
suspend fun getFollowingRelations(userID: String): List<Relation> = query {
    val followingMap: Map<String, Long> =
        Following.selectAll()
            .where { Following.follower eq userID }
            .map { it[Following.followee] to it[Following.createdAt] }
            .toList()
            .toMap()

    if (followingMap.isEmpty()) return@query emptyList()

    val userRows =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .select(Users.id, Users.username, Profiles.name)
            .where { Users.id inList followingMap.keys.toList() }
            .toList()

    val byId = userRows.associateBy({ it[Users.id] }, { it })

    followingMap.keys
        .mapNotNull { id ->
            val row = byId[id] ?: return@mapNotNull null
            val youFollowedAt = followingMap[id] ?: 0L
            Relation(
                userID = id,
                username = row[Users.username],
                name = row[Profiles.name],
                friendsAt = youFollowedAt,
                youFollowedAt = youFollowedAt,
                theyFollowedAt = 0L,
            )
        }
        .sortedByDescending { it.friendsAt }
}
