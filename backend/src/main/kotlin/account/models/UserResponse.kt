package app.burrow.account.models

import app.burrow.Error
import app.burrow.account.Users
import app.burrow.account.profile.FollowResponse
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.account.profile.getFollowing
import app.burrow.burrows.Burrow
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.models.Burrows
import app.burrow.query
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * A response to retrieving a user that includes details about them.
 *
 * @param user The user's details.
 * @param profile The user's profile.
 * @param following Following information.
 * @param recentJoinedGroups The groups the user joined that are coming up.
 * @param recentHostedGroups The groups the user is hosting that are coming up.
 */
@Serializable
data class UserResponse(
    val user: User,
    val profile: Profile,
    val following: FollowResponse,
    val recentJoinedGroups: List<Burrow>,
    val recentHostedGroups: List<Burrow>,
    val email: String? = null,
)

/**
 * Get a [UserResponse] from their [userID]
 *
 * @param userID The user to retrieve the [UserResponse] for.
 * @param requestingUserID An optional parameter to include who's requesting to see a profile's
 *   mutual friends.
 */
suspend fun getUserResponse(userID: String, requestingUserID: String): UserResponse = query {
    val userRow =
        Users.selectAll().where { Users.id eq userID }.singleOrNull()
            ?: throw Error(404, "User not found")

    val profileRow =
        Profiles.selectAll().where { Profiles.userID eq userID }.singleOrNull()
            ?: throw Error(404, "Profile not found")

    val following = getFollowing(userID, requestingUserID)
    val isFriends = following.theyFollow && following.youFollow

    var profile = Profile.fromRow(profileRow)

    // check the privacy
    // if it's private or friends (and they're not friends)
    val isPrivate = profile.visibility == Profile.Visibility.PRIVATE
    val isNotFriends = profile.visibility == Profile.Visibility.FRIENDS && !isFriends

    val cannotSee = requestingUserID != userID && (isPrivate || isNotFriends)

    if (cannotSee) {
        // remove all details
        profile =
            Profile(
                userID = profile.userID,
                name = profile.name,
                visibility = profile.visibility,
                bio = null,
                gradYear = null,
                classes = null,
                phoneNumber = null,
                instagram = null,
            )
    }

    val now = System.currentTimeMillis()

    val hostedMeetings =
        Burrows.selectAll()
            .where { (Burrows.ownerID eq userID) and (Burrows.beginningTime greater now) }
            .orderBy(Burrows.beginningTime to SortOrder.ASC)
            .limit(3)
            .map { Burrow.fromRow(it) }
            .toList()

    val joinedMeetings =
        (Memberships innerJoin Burrows)
            .select(Burrows.columns)
            .where {
                (Memberships.userID eq userID) and
                    (Burrows.beginningTime greater now) and
                    (Memberships.role neq BurrowRole.HOST)
            }
            .orderBy(Burrows.beginningTime to SortOrder.ASC)
            .limit(3)
            .map { Burrow.fromRow(it) }
            .toList()

    UserResponse(
        user = User.fromRow(userRow),
        profile = profile,
        following = following,
        recentJoinedGroups = if (cannotSee) emptyList() else joinedMeetings,
        recentHostedGroups = if (cannotSee) emptyList() else hostedMeetings,
        email = if (requestingUserID == userID) userRow[Users.email] else null,
    )
}
