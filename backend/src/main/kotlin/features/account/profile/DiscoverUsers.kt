package app.burrow.features.account.profile

import app.burrow.features.account.Users
import app.burrow.features.burrows.membership.Memberships
import app.burrow.api.query
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.innerJoin
import org.jetbrains.exposed.v1.r2dbc.select

/**
 * The reasoning behind providing a [DiscoveredUser].
 *
 * @param priority The priority of the reasoning (which should appear first?).
 */
enum class DiscoverReasoning(val priority: Int) {
    // this user is in a Burrow with the requesting user.
    SHARED_BURROW(0),

    // a friend follows this user
    FRIEND_FOLLOWS(1),

    // this user follows you
    THEY_FOLLOW(2),

    // one of your friends is friends with this user
    SHARED_FRIEND(3),
}

/** A user that's offered through Discover. */
@Serializable
data class DiscoveredUser(
    /** The ID of the discovered user. */
    val userID: String,

    /** The username of the discovered user. */
    val username: String,

    /** The name of the discovered user. */
    val name: String,

    /** The reason this user was presented. */
    val reasoning: DiscoverReasoning,
)

/**
 * Discover all users that follow [requestingUserID] but [requestingUserID] does not.
 *
 * @param requestingUserID The user requesting to discover.
 */
private suspend fun discoverTheyFollow(requestingUserID: String): List<DiscoveredUser> = query {
    val following = getFollowing(requestingUserID)
    val followers = getFollowers(requestingUserID)

    val nonFriendFollowers = followers.filter { followerID -> followerID !in following }

    if (nonFriendFollowers.isEmpty()) return@query emptyList()

    val userRows =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .select(Users.id, Users.username, Profiles.name)
            .where { Users.id inList nonFriendFollowers }
            .toList()

    userRows.map { row ->
        DiscoveredUser(
            userID = row[Users.id],
            username = row[Users.username],
            name = row[Profiles.name],
            reasoning = DiscoverReasoning.THEY_FOLLOW,
        )
    }
}

/**
 * Discover users that your friends follow but you don't.
 *
 * @param requestingUserID The user requesting to discover.
 */
private suspend fun discoverFriendFollows(requestingUserID: String): List<DiscoveredUser> = query {
    val friendIDs = getFriends(requestingUserID).map { it.userID }
    val following = getFollowing(requestingUserID).toSet()

    if (friendIDs.isEmpty()) return@query emptyList()

    // get all users that friends follow
    val friendsFollowing =
        Following.select(Following.followee)
            .where { Following.follower inList friendIDs }
            .map { it[Following.followee] }
            .toList()
            .toSet()

    // filter out users already followed and friends
    val candidates =
        friendsFollowing.filter { userID ->
            userID != requestingUserID && userID !in following && userID !in friendIDs
        }

    if (candidates.isEmpty()) return@query emptyList()

    // fetch user info
    val userRows =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .select(Users.id, Users.username, Profiles.name)
            .where { Users.id inList candidates }
            .toList()

    userRows.map { row ->
        DiscoveredUser(
            userID = row[Users.id],
            username = row[Users.username],
            name = row[Profiles.name],
            reasoning = DiscoverReasoning.FRIEND_FOLLOWS,
        )
    }
}

/**
 * Discover friends of friends.
 *
 * @param requestingUserID The user requesting to discover.
 */
private suspend fun discoverSharedFriend(requestingUserID: String): List<DiscoveredUser> = query {
    val friendIDs = getFriends(requestingUserID).map { it.userID }
    val following = getFollowing(requestingUserID).toSet()

    if (friendIDs.isEmpty()) return@query emptyList()

    // get friends of each friend
    val friendsOfFriends = mutableSetOf<String>()
    for (friendID in friendIDs) {
        val theirFriends = getFriends(friendID).map { it.userID }
        friendsOfFriends.addAll(theirFriends)
    }

    // filter out requesting user, existing friends, and users already followed
    val candidates =
        friendsOfFriends.filter { userID ->
            userID != requestingUserID && userID !in friendIDs && userID !in following
        }

    if (candidates.isEmpty()) return@query emptyList()

    // fetch user info
    val userRows =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .select(Users.id, Users.username, Profiles.name)
            .where { Users.id inList candidates }
            .toList()

    userRows.map { row ->
        DiscoveredUser(
            userID = row[Users.id],
            username = row[Users.username],
            name = row[Profiles.name],
            reasoning = DiscoverReasoning.SHARED_FRIEND,
        )
    }
}

/**
 * Discover users that are in Burrows with [requestingUserID].
 *
 * @param requestingUserID The user requesting to discover.
 */
private suspend fun discoverInSharedBurrows(requestingUserID: String): List<DiscoveredUser> =
    query {
        val requestingUserBurrows =
            Memberships.select(Memberships.burrowID)
                .where { Memberships.userID eq requestingUserID }
                .map { it[Memberships.burrowID] }
                .toList()

        // user isn't in any burrows
        if (requestingUserBurrows.isEmpty()) return@query emptyList()

        // all users in the burrows
        val usersInSharedBurrows =
            Memberships.select(Memberships.userID, Memberships.burrowID)
                .where { Memberships.burrowID inList requestingUserBurrows }
                .toList()
                .filter { it[Memberships.userID] != requestingUserID }

        // all burrows user is in are empty
        if (usersInSharedBurrows.isEmpty()) return@query emptyList()

        // count amount shared
        val userSharedBurrowCount =
            usersInSharedBurrows
                .groupBy { it[Memberships.userID] }
                .mapValues { (_, memberships) -> memberships.size }

        val friendIDs = getFriends(requestingUserID).map { it.userID }.toSet()
        val following = getFollowing(requestingUserID).toSet()

        // filter out friends and users already followed
        val nonFriendUsers =
            userSharedBurrowCount
                .filterKeys { userID -> userID !in friendIDs && userID !in following }
                .toList()
                .sortedByDescending { (_, sharedBurrowCount) -> sharedBurrowCount }

        // if only shared with friends or already following all
        if (nonFriendUsers.isEmpty()) return@query emptyList()

        val userIDs = nonFriendUsers.map { it.first }

        // get username and name
        val userRows =
            Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
                .select(Users.id, Users.username, Profiles.name)
                .where { Users.id inList userIDs }
                .toList()

        val userInfoMap =
            userRows.associateBy({ it[Users.id] }, { it[Users.username] to it[Profiles.name] })

        nonFriendUsers.mapNotNull { (userID, _) ->
            val (username, name) = userInfoMap[userID] ?: return@mapNotNull null

            DiscoveredUser(
                userID = userID,
                username = username,
                name = name,
                reasoning = DiscoverReasoning.SHARED_BURROW,
            )
        }
    }

/**
 * Discover users for [requestingUserID].
 *
 * @param requestingUserID The user requesting to discover.
 * @return List of up to 10 discovered users, sorted by priority.
 */
suspend fun discoverUsers(requestingUserID: String): List<DiscoveredUser> {
    val sharedBurrows = discoverInSharedBurrows(requestingUserID)
    val friendFollows = discoverFriendFollows(requestingUserID)
    val theyFollow = discoverTheyFollow(requestingUserID)
    val sharedFriends = discoverSharedFriend(requestingUserID)

    val allDiscovered =
        (sharedBurrows + friendFollows + theyFollow + sharedFriends)
            .groupBy { it.userID }
            .map { (_, users) -> users.minBy { it.reasoning.priority } }

    return allDiscovered.sortedBy { it.reasoning.priority }.take(10)
}
