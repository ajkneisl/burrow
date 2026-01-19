package app.burrow.account.models

import app.burrow.Error
import app.burrow.account.profile.FollowResponse
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.account.profile.getFollowing
import app.burrow.account.ta.getUserTAStatus
import app.burrow.burrows.models.BurrowResponse
import app.burrow.burrows.searchBurrows
import app.burrow.query
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * A response to retrieving a user that includes details about them.
 *
 * @param user The user's details.
 * @param profile The user's profile.
 * @param following Following information.
 * @param recentJoinedBurrows The Burrows the user joined that are coming up.
 * @param recentHostedBurrows The Burrows the user is hosting that are coming up.
 * @param email The user's email. This is only responded with if the user is requesting themself.
 * @param isTa If the user is an approved TA.
 */
@Serializable
data class UserResponse(
    val user: User,
    val profile: Profile,
    val following: FollowResponse,
    val recentJoinedBurrows: List<BurrowResponse>,
    val recentHostedBurrows: List<BurrowResponse>,
    val email: String? = null,
    val isTa: Boolean? = null,
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
                school = null,
                major = null,
                phoneNumber = null,
                instagram = null,
                linkedIn = null,
            )
    }

    val hostedMeetings =
        searchBurrows {
                limit = 3
                isHostedBy = userID

                this.requestingUserID = requestingUserID
            }
            .contents

    val joinedMeetings =
        searchBurrows {
                limit = 3
                isJoinedBy = userID

                this.requestingUserID = requestingUserID
            }
            .contents

    // Check if the user is a TA
    val isTa = getUserTAStatus(userID) != null

    UserResponse(
        user = User.fromRow(userRow),
        profile = profile,
        following = following,
        recentJoinedBurrows = joinedMeetings,
        recentHostedBurrows = hostedMeetings,
        email = if (requestingUserID == userID) userRow[Users.email] else null,
        isTa = isTa,
    )
}
