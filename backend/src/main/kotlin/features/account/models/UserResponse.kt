package app.burrow.features.account.models

import app.burrow.api.Error
import app.burrow.features.account.Users
import app.burrow.features.account.isBlockedBy
import app.burrow.features.account.profile.Badge
import app.burrow.features.account.profile.FollowResponse
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.Profiles
import app.burrow.features.account.profile.getAllBadges
import app.burrow.features.account.profile.getFollowing
import app.burrow.features.account.ta.getUserTAStatus
import app.burrow.features.burrows.models.BurrowResponse
import app.burrow.features.burrows.searchBurrows
import app.burrow.query
import app.burrow.toEntity
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.innerJoin
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
 * @param isBlocked If the requesting user has blocked this user.
 */
@Serializable
data class UserResponse(
    val user: User,
    val profile: Profile,
    val following: FollowResponse,
    val recentJoinedBurrows: List<BurrowResponse>,
    val recentHostedBurrows: List<BurrowResponse>,
    val badges: List<Badge>? = null,
    val email: String? = null,
    val isTa: Boolean? = null,
    val isBlocked: Boolean? = null,
)

/**
 * Get a [UserResponse] from their [userID]
 *
 * @param userID The user to retrieve the [UserResponse] for.
 * @param requestingUserID An optional parameter to include who's requesting to see a profile's
 *   mutual friends.
 */
suspend fun getUserResponse(userID: String, requestingUserID: String): UserResponse = query {
    val row =
        Users.innerJoin(Profiles, { Users.id }, { Profiles.userID })
            .selectAll()
            .where { Users.id eq userID }
            .singleOrNull() ?: throw Error(404, "User not found")

    val following = getFollowing(userID, requestingUserID)
    val isFriends = following.theyFollow && following.youFollow

    var profile = row.toEntity<Profile>(Profiles)

    // resolve badge descriptions
    val allBadges = getAllBadges()
    val userBadges =
        profile.badges.map { badge -> allBadges.find { it.id == badge } ?: Badge(badge, "") }

    val isPrivate = profile.visibility == Profile.Visibility.PRIVATE
    val isNotFriends = profile.visibility == Profile.Visibility.FRIENDS && !isFriends

    val isTa = getUserTAStatus(userID) != null
    val requestorBlockedUser =
        if (requestingUserID != userID) isBlockedBy(requestingUserID, userID) else null
    val userBlockedRequestor = isBlockedBy(userID, requestingUserID)

    val cannotSee =
        requestingUserID != userID // ensure that not requesting themselves
        &&
            (isPrivate || isNotFriends) // if private and user is not friends
            &&
            userBlockedRequestor // user blocked requesting user

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
                badges = listOf(),
            )

        UserResponse(
            user = row.toEntity(Users),
            profile = profile,
            following = following,
            recentJoinedBurrows = listOf(),
            recentHostedBurrows = listOf(),
            badges = userBadges,
            email = null,
            isTa = isTa,
            isBlocked = requestorBlockedUser,
        )
    } else {
        // the burrows requested user is hosting
        val hostedMeetings =
            searchBurrows {
                    limit = 3
                    isHostedBy = userID

                    this.requestingUserID = requestingUserID
                }
                .contents

        // the burrows the requested user joined
        val joinedMeetings =
            searchBurrows {
                    limit = 3
                    isJoinedBy = userID
                    isNotHostedBy = userID
                    this.requestingUserID = requestingUserID
                }
                .contents

        UserResponse(
            user = row.toEntity(Users),
            profile = profile,
            following = following,
            recentJoinedBurrows = joinedMeetings,
            recentHostedBurrows = hostedMeetings,
            badges = userBadges,
            email = if (requestingUserID == userID) row[Users.email] else null,
            isTa = isTa,
            isBlocked = requestorBlockedUser,
        )
    }
}
