package app.burrow.features.account.ta

import app.burrow.MappedTable
import app.burrow.features.account.Users
import app.burrow.query
import app.burrow.toEntity
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** All users who are TAs */
object Ta : Table("account_ta") {
    /** The ID of the user with TA status. */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** The classes the user is a TA for. */
    val classes = array<String>("classes")

    /** When the user was approved to be a TA. */
    val approvalDate = long("approval_date")

    /** When the user's TA status expires. */
    val expireDate = long("expireDate")

    /** Which admin approved this TA. */
    val approvedBy = varchar("approved_by", 64)
}

@Serializable
@MappedTable(Ta::class)
data class TAStatus(
    val userID: String,
    val classes: List<String>,
    val approvalDate: Long,
    val expireDate: Long,
    val approvedBy: String,
)

/** Check if [userID] is a TA. */
suspend fun getUserTAStatus(userID: String): TAStatus? = query {
    Ta.selectAll().where { Ta.userID eq userID }.firstOrNull()?.let { it.toEntity<TAStatus>(Ta) }
}

/** Get the set of user IDs that are TAs from the provided list. */
suspend fun getTAUserIDs(userIDs: List<String>): Set<Pair<String, List<String>>> = query {
    if (userIDs.isEmpty()) return@query emptySet()

    Ta.selectAll()
        .where { Ta.userID inList userIDs }
        .toList()
        .map { it[Ta.userID] to it[Ta.classes] }
        .toSet()
}
