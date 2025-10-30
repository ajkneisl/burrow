package app.burrow.account.profile

import app.burrow.account.Users
import app.burrow.errors.ServerError
import app.burrow.query
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll

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

    val mutualsCount = getFollowers(userID).intersect(getFollowers(otherUserID).toSet()).size

    FollowResponse(
        following = followingCount,
        followers = followersCount,
        mutuals = if (userID == otherUserID) 0 else mutualsCount,
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

/** Check if [followerID] is following [followeeID]. */
suspend fun isFollowing(followerID: String, followeeID: String): Boolean = query {
    Following.selectAll()
        .where { (Following.follower eq followerID) and (Following.followee eq followeeID) }
        .count() > 0
}

/** Follow a user. */
suspend fun followUser(followerID: String, followeeID: String) = query {
    if (followerID == followeeID) {
        throw ServerError(400, "You cannot follow yourself.")
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
