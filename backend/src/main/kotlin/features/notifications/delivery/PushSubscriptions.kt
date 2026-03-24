package app.burrow.features.notifications.delivery

import app.burrow.api.UUIDSerializer
import app.burrow.features.account.Users
import app.burrow.api.query
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

/** Push subscriptions for browser notifications. */
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
    @Serializable(with = UUIDSerializer::class) val id: UUID,
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

/** Push subscriptions for mobile (Expo) notifications. */
object MobilePushSubscriptions : Table("mobile_push_subscriptions") {
    /** [MobilePushSubscription.id] */
    val id = uuid("id").autoGenerate()

    /** [MobilePushSubscription.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [MobilePushSubscription.deviceToken] */
    val deviceToken = text("device_token")

    /** [MobilePushSubscription.createdAt] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        index(false, userID)
        uniqueIndex(deviceToken)
    }
}

/**
 * A mobile push subscription for Expo notifications.
 *
 * @param id The subscription ID.
 * @param userID The user ID.
 * @param deviceToken The Expo push token (e.g., ExponentPushToken[...]).
 * @param createdAt When the subscription was created.
 */
@Serializable
data class MobilePushSubscription(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val userID: String,
    val deviceToken: String,
    val createdAt: Long,
)

/**
 * Subscribe a user to mobile push notifications.
 *
 * @param userID The user ID.
 * @param deviceToken The Expo push token.
 * @return The created subscription.
 */
suspend fun subscribeToMobilePush(
    userID: String,
    deviceToken: String,
    createdAt: Long = getTimeMillis(),
): MobilePushSubscription = query {
    val id = UUID.randomUUID()

    MobilePushSubscriptions.deleteWhere { MobilePushSubscriptions.deviceToken eq deviceToken }

    MobilePushSubscriptions.insert {
        it[MobilePushSubscriptions.id] = id
        it[MobilePushSubscriptions.userID] = userID
        it[MobilePushSubscriptions.deviceToken] = deviceToken
        it[MobilePushSubscriptions.createdAt] = createdAt
    }

    MobilePushSubscription(id, userID, deviceToken, createdAt)
}

/**
 * Unsubscribe from mobile push notifications.
 *
 * @param userID The user ID.
 */
suspend fun unsubscribeFromMobilePush(userID: String) = query {
    MobilePushSubscriptions.deleteWhere { (MobilePushSubscriptions.userID eq userID) }
}

/**
 * Get all mobile push subscriptions for a user.
 *
 * @param userID The user ID.
 * @return List of mobile push subscriptions.
 */
suspend fun getUserMobilePushSubscriptions(userID: String): List<MobilePushSubscription> = query {
    MobilePushSubscriptions.selectAll()
        .where { MobilePushSubscriptions.userID eq userID }
        .map {
            MobilePushSubscription(
                id = it[MobilePushSubscriptions.id],
                userID = it[MobilePushSubscriptions.userID],
                deviceToken = it[MobilePushSubscriptions.deviceToken],
                createdAt = it[MobilePushSubscriptions.createdAt],
            )
        }
        .toList()
}

/**
 * Delete a specific mobile push subscription.
 *
 * @param subscriptionID The subscription ID to delete.
 */
suspend fun deleteMobilePushSubscription(subscriptionID: UUID) = query {
    MobilePushSubscriptions.deleteWhere { MobilePushSubscriptions.id eq subscriptionID }
}
