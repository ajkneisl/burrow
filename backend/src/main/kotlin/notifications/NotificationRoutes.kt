package app.burrow.notifications

import app.burrow.account.models.userID
import app.burrow.notifications.delivery.channels.Browser
import app.burrow.notifications.delivery.channels.Sse
import app.burrow.notifications.delivery.subscribeToPush
import app.burrow.notifications.delivery.unsubscribeFromPush
import app.burrow.optionalIntQueryParameter
import app.burrow.queryParameter
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import java.util.UUID
import kotlinx.serialization.Serializable

/** Routes relating to notifications. */
val NOTIFICATION_ROUTES: Route.() -> Unit = {
    authenticate("primary") {
        // GET /notifications
        // retrieve all a user's notifications
        get {
            val page = call.optionalIntQueryParameter("page") ?: 1

            val notifications = getNotifications(call.userID, page)

            call.respond(notifications)
        }

        // DELETE /notifications
        // clear all of a user's notifications
        delete {
            deleteAllNotifications(call.userID)

            call.respond(HttpStatusCode.OK)
        }

        // POST /notifications/{id}
        // marks a notification as read / unread
        post("/{id}") {
            val id = call.urlParameter("id")

            val uuid =
                runCatching { UUID.fromString(id) }.getOrNull()
                    ?: return@post call.respond(HttpStatusCode.BadRequest)

            call.respond(HttpStatusCode.OK, toggleReadNotification(call.userID, uuid))
        }

        // DELETE /notifications/{id}
        // deletes a notifications
        delete("/{id}") {
            val id = call.urlParameter("id")

            val uuid =
                runCatching { UUID.fromString(id) }.getOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest)

            deleteNotification(call.userID, uuid)
            call.respond(HttpStatusCode.OK)
        }

        // POST /notifications/push/subscribe
        // subscribe to push notifications
        post("/push/subscribe") {
            val request = call.receive<PushSubscribeRequest>()

            val subscription =
                subscribeToPush(
                    userID = call.userID,
                    endpoint = request.endpoint,
                    p256dh = request.keys.p256dh,
                    auth = request.keys.auth,
                )

            call.respond(HttpStatusCode.Created, subscription)
        }

        // POST /notifications/push/unsubscribe
        // unsubscribe from push notifications
        post("/push/unsubscribe") {
            val request = call.receive<PushUnsubscribeRequest>()

            unsubscribeFromPush(call.userID, request.endpoint)

            call.respond(HttpStatusCode.OK)
        }
    }

    // GET /notifications/push/vapid
    // get the VAPID public key for push notifications
    get("/push/vapid") { call.respond(hashMapOf("key" to (Browser.vapidPublicKey ?: ""))) }

    // SSE /notifications/live
    route("/live", Sse.ROUTE)
}

/** Request to subscribe to push notifications. */
@Serializable private data class PushSubscribeRequest(val endpoint: String, val keys: PushKeys)

/** Push subscription keys. */
@Serializable private data class PushKeys(val p256dh: String, val auth: String)

/** Request to unsubscribe from push notifications. */
@Serializable private data class PushUnsubscribeRequest(val endpoint: String)
