package app.burrow.burrows.invites

import app.burrow.account.models.userID
import app.burrow.burrows.membership.requireModerator
import app.burrow.optionalEnumQueryParameter
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable

/** Requests relating to join requests. */
fun Route.joinRequestRoutes() {
    // ROUTE /{id}/requests
    // manage requests for a specific Burrow.
    route("/{id}/requests") {
        // GET /groups/{id}/requests
        // get all pending requests.
        get {
            val burrowID = call.urlParameter("id")

            call.requireModerator(burrowID)

            val requests = getJoinRequests(burrowID)
            call.respond(requests)
        }

        /**
         * Payload for accepting/denying a join request.
         *
         * @param requesterId The ID of the user who made the request.
         */
        @Serializable data class ReviewRequestPayload(val requesterId: String)

        // POST /burrows/{id}/requests/accept
        // accept a join request (host/moderator only).
        post("/accept") {
            val burrowID = call.urlParameter("id")
            val reviewerID = call.userID
            val payload = call.receive<ReviewRequestPayload>()

            call.requireModerator(burrowID)

            acceptJoinRequest(payload.requesterId, burrowID, reviewerID)

            call.respond(HttpStatusCode.OK)
        }

        // POST /burrows/{id}/requests/deny
        // deny a join request (host/moderator only)
        post("/deny") {
            val burrowID = call.urlParameter("id")
            val reviewerID = call.userID
            val payload = call.receive<ReviewRequestPayload>()

            call.requireModerator(burrowID)

            denyJoinRequest(payload.requesterId, burrowID, reviewerID)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /groups/{id}/requests
        // cancel your own join request
        delete {
            val burrowID = call.urlParameter("id")
            val userID = call.userID

            cancelJoinRequest(userID, burrowID)

            call.respond(HttpStatusCode.OK)
        }

        // GET /groups/{id}/requests/count
        // get count of pending requests for a burrow (host/moderator only)
        get("/count") {
            val burrowID = call.urlParameter("id")

            call.requireModerator(burrowID)

            val count = getPendingRequestCount(burrowID)
            call.respond(mapOf("count" to count))
        }
    }

    // GET /burrows/requests
    route("/requests") {
        // GET /requests
        // get all join requests for the authenticated user
        get {
            val userID = call.userID
            val status = call.optionalEnumQueryParameter<JoinRequestStatus>("status")

            val requests = getJoinRequestsForUser(userID, status)
            call.respond(requests)
        }
    }
}
