package app.burrow.features.requests

import app.burrow.features.account.models.userID
import app.burrow.features.burrows.membership.requireModerator
import app.burrow.features.invites.InviteType
import app.burrow.api.optionalEnumQueryParameter
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable

// ROUTES /burrows/{id}/requests, /burrows/requests
// manage join requests
fun Route.joinRequestRoutes() {
    // ROUTE /burrows/{id}/requests
    // manage requests for a specific Burrow.
    route("/{id}/requests") {
        // GET /burrows/{id}/requests
        // get all pending requests.
        get {
            val burrowID = call.urlParameter("id")
            val page = call.optionalIntQueryParameter("page") ?: 1

            call.requireModerator(burrowID)

            val requests = getJoinRequests(burrowID, InviteType.BURROW, page)
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

            acceptJoinRequest(payload.requesterId, burrowID, InviteType.BURROW, reviewerID)

            call.respond(HttpStatusCode.OK)
        }

        // POST /burrows/{id}/requests/deny
        // deny a join request (host/moderator only)
        post("/deny") {
            val burrowID = call.urlParameter("id")
            val reviewerID = call.userID
            val payload = call.receive<ReviewRequestPayload>()

            call.requireModerator(burrowID)

            denyJoinRequest(payload.requesterId, burrowID, InviteType.BURROW, reviewerID)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /burrows/{id}/requests
        // cancel your own join request
        delete {
            val burrowID = call.urlParameter("id")
            val userID = call.userID

            cancelJoinRequest(userID, burrowID, InviteType.BURROW)

            call.respond(HttpStatusCode.OK)
        }

        // GET /burrows/{id}/requests/count
        // get count of pending requests for a burrow
        get("/count") {
            val burrowID = call.urlParameter("id")

            call.requireModerator(burrowID)

            val count = getPendingRequestCount(burrowID, InviteType.BURROW)
            call.respond(mapOf("count" to count))
        }
    }

    // GET /burrows/requests
    // manage a user's overall requests
    route("/requests") {
        // GET /burrows/requests
        // get all join requests for the authenticated user
        get {
            val userID = call.userID
            val status = call.optionalEnumQueryParameter<JoinRequestStatus>("status")
            val type = call.optionalEnumQueryParameter<InviteType>("type")

            val requests = getJoinRequestsForUser(userID, status, type)
            call.respond(requests)
        }
    }
}
