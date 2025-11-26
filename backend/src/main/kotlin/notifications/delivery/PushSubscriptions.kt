package app.burrow.notifications.delivery

import app.burrow.account.models.Users
import app.burrow.account.chat.ChatMessage
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** Web Push subscriptions for browser notifications. */
object PushSubscriptions : Table("push_subscriptions") {
    /** [PushSubscription.id] */
    val id = uuid("id").autoGenerate()

    /** [PushSubscription.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [PushSubscription.endpoint] */
    val endpoint = text("endpoint")

    /** [PushSubscription.p256dh] */
    val p256dh = text("p256dh")

    /** [PushSubscription.auth] */
    val auth = text("auth")

    /** [PushSubscription.createdAt] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        index(false, userID)
        uniqueIndex(endpoint)
    }
}

/**
 * A web push subscription.
 *
 * @param id The subscription ID.
 * @param userID The user ID.
 * @param endpoint The push service endpoint.
 * @param p256dh The p256dh encryption key.
 * @param auth The auth secret.
 * @param createdAt When the subscription was created.
 */
@Serializable
data class PushSubscription(
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val id: UUID,
    val userID: String,
    val endpoint: String,
    val p256dh: String,
    val auth: String,
    val createdAt: Long,
)

/**
 * Subscribe a user to push notifications.
 *
 * @param userID The user ID.
 * @param endpoint The push endpoint.
 * @param p256dh The p256dh key.
 * @param auth The auth secret.
 * @return The created subscription.
 */
suspend fun subscribeToPush(
    userID: String,
    endpoint: String,
    p256dh: String,
    auth: String,
    createdAt: Long = getTimeMillis(),
): PushSubscription = query {
    val id = UUID.randomUUID()

    PushSubscriptions.deleteWhere { PushSubscriptions.endpoint eq endpoint }

    PushSubscriptions.insert {
        it[PushSubscriptions.id] = id
        it[PushSubscriptions.userID] = userID
        it[PushSubscriptions.endpoint] = endpoint
        it[PushSubscriptions.p256dh] = p256dh
        it[PushSubscriptions.auth] = auth
        it[PushSubscriptions.createdAt] = createdAt
    }

    PushSubscription(id, userID, endpoint, p256dh, auth, createdAt)
}

/**
 * Unsubscribe from push notifications.
 *
 * @param userID The user ID.
 * @param endpoint The endpoint to remove.
 */
suspend fun unsubscribeFromPush(userID: String, endpoint: String) = query {
    PushSubscriptions.deleteWhere {
        (PushSubscriptions.userID eq userID) and (PushSubscriptions.endpoint eq endpoint)
    }
}

/**
 * Get all push subscriptions for a user.
 *
 * @param userID The user ID.
 * @return List of push subscriptions.
 */
suspend fun getUserPushSubscriptions(userID: String): List<PushSubscription> = query {
    PushSubscriptions.selectAll()
        .where { PushSubscriptions.userID eq userID }
        .map {
            PushSubscription(
                id = it[PushSubscriptions.id],
                userID = it[PushSubscriptions.userID],
                endpoint = it[PushSubscriptions.endpoint],
                p256dh = it[PushSubscriptions.p256dh],
                auth = it[PushSubscriptions.auth],
                createdAt = it[PushSubscriptions.createdAt],
            )
        }
        .toList()
}

/**
 * Delete a specific push subscription.
 *
 * @param subscriptionID The subscription ID to delete.
 */
suspend fun deletePushSubscription(subscriptionID: UUID) = query {
    PushSubscriptions.deleteWhere { PushSubscriptions.id eq subscriptionID }
}
