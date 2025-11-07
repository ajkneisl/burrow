package app.burrow.burrows.models

import app.burrow.account.profile.Profile
import app.burrow.burrows.Burrow
import app.burrow.burrows.membership.Membership
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
 * @param bookmarked If the user requesting has this bookmarked. If this is a guest request, it will
 *   be false.
 * @param highlightedTags The tags that are of interest to the user. This is a list of their indexes
 *   in [app.burrow.groups.Burrow.tags].
 */
@Serializable
data class BurrowResponse(
    val burrow: Burrow,
    val burrowAuthor: String?,
    val burrowAuthorProfile: Profile? = null,
    var membership: Membership?,
    var bookmarked: Boolean,
    var highlightedTags: List<Int> = listOf(),
)
