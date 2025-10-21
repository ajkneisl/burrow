package app.burrow.notifications

import app.burrow.notifications.delivery.channels.Sse
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import java.util.UUID

/** Routes relating to notifications. */
val NOTIFICATION_ROUTES: Route.() -> Unit = {
    authenticate("primary") {
        // GET /notifications
        // retrieve all a user's notifications
        get {
            val userId =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@get call.respond(HttpStatusCode.Forbidden)

            call.respond(HttpStatusCode.OK, getNotifications(userId))
        }

        // DELETE /notifications
        // clear all of a user's notifications
        delete {
            val userId =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@delete call.respond(HttpStatusCode.Forbidden)

            deleteAllNotifications(userId)

            call.respond(HttpStatusCode.OK)
        }

        // POST /notifications/{id}
        // marks a notification as read / unread
        post("/{id}") {
            val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            val userId =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@post call.respond(HttpStatusCode.Forbidden)

            val uuid =
                runCatching { UUID.fromString(id) }.getOrNull()
                    ?: return@post call.respond(HttpStatusCode.BadRequest)

            call.respond(HttpStatusCode.OK, toggleReadNotification(userId, uuid))
        }

        // DELETE /notifications/{id}
        // deletes a notifications
        delete("/{id}") {
            val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
            val userId =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@delete call.respond(HttpStatusCode.Forbidden)

            val uuid =
                runCatching { UUID.fromString(id) }.getOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest)

            deleteNotification(userId, uuid)
            call.respond(HttpStatusCode.OK)
        }
    }

    // SSE /notifications/live
    route("/live", Sse.ROUTE)
}
