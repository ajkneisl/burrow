package app.burrow.features.burrows.models

import app.burrow.features.account.profile.Profile
import app.burrow.features.burrows.membership.Membership
import kotlinx.serialization.Serializable

/**
 * A response to requesting a group meeting. This includes the requesting user's membership status,
 * which will dictate whether they should have a join / leave button.
 *
 * @param burrow The meeting.
 * @param burrowAuthor The meeting's author.
 * @param burrowAuthorProfile The meeting's author's profile.
 * @param membership The requesting user's membership to [burrow]. If this is guest request (only
 *   possible on requesting a SINGLE group), then this will be null.
 * @param requestedToJoin If the requesting user has requested to join this [burrow].
 * @param bookmarked If the user requesting has this bookmarked. If this is a guest request, it will
 *   be false.
 * @param highlightedTags The tags that are of interest to the user. This is a list of their indexes
 *   in [app.burrow.groups.Burrow.tags].
 * @param hostedbyTa If the meeting is hosted by an approved TA for the class.
 */
@Serializable
data class BurrowResponse(
    val burrow: Burrow,
    val burrowAuthor: String?,
    val burrowAuthorProfile: Profile? = null,
    var membership: Membership?,
    var requestedToJoin: Boolean? = null,
    var bookmarked: Boolean,
    var highlightedTags: List<Int> = listOf(),
    var hostedByTa: Boolean? = null,
    val joined: Long,
    val waiting: Long,
    val clubName: String? = null,
    val clubDisplayName: String? = null,
)
