package app.burrow.account.models

import app.burrow.account.Users
import app.burrow.account.profile.FollowResponse
import app.burrow.account.profile.Profile
import app.burrow.account.profile.Profiles
import app.burrow.account.profile.getFollowing
import app.burrow.errors.ServerError
import app.burrow.groups.Meetings
import app.burrow.groups.membership.Memberships
import app.burrow.groups.models.GroupMeeting
import app.burrow.groups.models.MeetingRole
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
    val recentJoinedGroups: List<GroupMeeting>,
    val recentHostedGroups: List<GroupMeeting>,
)

/**
 * Get a [UserResponse] from their [userID]
 *
 * @param userID The user to retrieve the [UserResponse] for.
 * @param requestingUserID An optional parameter to include who's requesting to see a profile's
 *   mutual friends.
 */
suspend fun getUserResponse(userID: String, requestingUserID: String): UserResponse =
    query {
        val userRow =
            Users.selectAll().where { Users.id eq userID }.singleOrNull()
                ?: throw ServerError(404, "User not found")

        val profileRow =
            Profiles.selectAll().where { Profiles.userID eq userID }.singleOrNull()
                ?: throw ServerError(404, "Profile not found")

        val now = System.currentTimeMillis()

        val hostedMeetings =
            Meetings.selectAll()
                .where { (Meetings.owner eq userID) and (Meetings.beginningTime greater now) }
                .orderBy(Meetings.beginningTime to SortOrder.ASC)
                .limit(3)
                .map { GroupMeeting.fromRow(it) }
                .toList()

        val joinedMeetings =
            (Memberships innerJoin Meetings)
                .select(Meetings.columns)
                .where {
                    (Memberships.userID eq userID) and
                        (Meetings.beginningTime greater now) and
                        (Memberships.role neq MeetingRole.HOST)
                }
                .orderBy(Meetings.beginningTime to SortOrder.ASC)
                .limit(3)
                .map { GroupMeeting.fromRow(it) }
                .toList()

        UserResponse(
            user = User.fromRow(userRow),
            profile = Profile.fromRow(profileRow),
            following = getFollowing(userID, requestingUserID),
            recentJoinedGroups = joinedMeetings,
            recentHostedGroups = hostedMeetings,
        )
    }
