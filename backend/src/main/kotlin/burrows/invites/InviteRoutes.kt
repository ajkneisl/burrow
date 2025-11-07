package app.burrow.burrows.invites

import app.burrow.InvalidAuthorization
import app.burrow.Error
import app.burrow.account.models.userID
import app.burrow.burrows.membership.getMembership
import app.burrow.burrows.models.BurrowRole
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

/**
 * Routes for managing burrow invitations.
 *
 * All routes require authentication.
 */
fun Route.inviteRoutes() {
    route("/{id}/invites") {
        /**
         * Payload for creating an invite.
         *
         * @param inviteeId The ID of the user being invited.
         * @param expiresAt Optional expiration timestamp (epoch ms).
         */
        @Serializable
        data class CreateInvitePayload(val inviteeId: String, val expiresAt: Long? = null)

        // POST /groups/{id}/invites
        // Create an invitation to a burrow
        post {
            val burrowId = call.urlParameter("id")
            val inviterId = call.userID
            val payload = call.receive<CreateInvitePayload>()

            // Check that inviter is at least a moderator
            val membership = getMembership(inviterId, burrowId) ?: throw InvalidAuthorization()

            if (membership.role == BurrowRole.MEMBER) {
                throw InvalidAuthorization()
            }

            createInvite(
                inviterId = inviterId,
                inviteeId = payload.inviteeId,
                burrowId = burrowId,
                expiresAt = payload.expiresAt,
            )

            call.respond(HttpStatusCode.Created)
        }

        // GET /groups/{id}/invites
        // Get all pending invites for a burrow (host/moderator only)
        get {
            val burrowId = call.urlParameter("id")
            val userId = call.userID

            // Check that user is at least a moderator
            val membership = getMembership(userId, burrowId) ?: throw InvalidAuthorization()

            if (membership.role == BurrowRole.MEMBER) {
                throw InvalidAuthorization()
            }

            val invites = getInvitesForBurrow(burrowId)
            call.respond(invites)
        }

        // DELETE /groups/{id}/invites/{inviteeId}
        // Cancel an invitation (inviter only)
        delete("/{inviteeId}") {
            val burrowId = call.urlParameter("id")
            val inviteeId =
                call.parameters["inviteeId"]
                    ?: throw Error(400, "Missing inviteeId parameter")
            val inviterId = call.userID

            cancelInvite(inviterId, inviteeId, burrowId)

            call.respond(HttpStatusCode.OK)
        }
    }

    // Routes under /invites (not scoped to a specific burrow)
    route("/invites") {
        // GET /invites/received
        // Get all invites received by the authenticated user
        get("/received") {
            val userId = call.userID
            val status = call.optionalEnumQueryParameter<InviteStatus>("status")

            val invites = getReceivedInvites(userId, status)
            call.respond(invites)
        }

        // GET /invites/sent
        // Get all invites sent by the authenticated user
        get("/sent") {
            val userId = call.userID
            val status = call.optionalEnumQueryParameter<InviteStatus>("status")

            val invites = getSentInvites(userId, status)
            call.respond(invites)
        }

        // POST /invites/{burrowId}/accept
        // Accept an invitation
        post("/{burrowId}/accept") {
            val burrowId =
                call.parameters["burrowId"] ?: throw Error(400, "Missing burrowId parameter")
            val userId = call.userID

            acceptInvite(userId, burrowId)

            call.respond(HttpStatusCode.OK)
        }

        // POST /invites/{burrowId}/decline
        // Decline an invitation
        post("/{burrowId}/decline") {
            val burrowId =
                call.parameters["burrowId"] ?: throw Error(400, "Missing burrowId parameter")
            val userId = call.userID

            declineInvite(userId, burrowId)

            call.respond(HttpStatusCode.OK)
        }

        // GET /invites/count
        // Get count of pending invites for the authenticated user
        get("/count") {
            val userId = call.userID
            val count = getPendingInviteCountForUser(userId)

            call.respond(mapOf("count" to count))
        }
    }
}

/**
 * Routes for managing burrow join requests.
 *
 * All routes require authentication.
 */
fun Route.joinRequestRoutes() {
    route("/{id}/requests") {
        // POST /groups/{id}/requests
        // Create a join request for a burrow
        post {
            val burrowId = call.urlParameter("id")
            val userId = call.userID

            createJoinRequest(userId, burrowId)

            call.respond(HttpStatusCode.Created)
        }

        // GET /groups/{id}/requests
        // Get all pending join requests for a burrow (host/moderator only)
        get {
            val burrowId = call.urlParameter("id")
            val userId = call.userID

            // Check that user is at least a moderator
            val membership = getMembership(userId, burrowId) ?: throw InvalidAuthorization()

            if (membership.role == BurrowRole.MEMBER) {
                throw InvalidAuthorization()
            }

            val requests = getJoinRequests(burrowId)
            call.respond(requests)
        }

        /**
         * Payload for accepting/denying a join request.
         *
         * @param requesterId The ID of the user who made the request.
         */
        @Serializable data class ReviewRequestPayload(val requesterId: String)

        // POST /groups/{id}/requests/accept
        // Accept a join request (host/moderator only)
        post("/accept") {
            val burrowId = call.urlParameter("id")
            val reviewerId = call.userID
            val payload = call.receive<ReviewRequestPayload>()

            // Check that reviewer is at least a moderator
            val membership = getMembership(reviewerId, burrowId) ?: throw InvalidAuthorization()

            if (membership.role == BurrowRole.MEMBER) {
                throw InvalidAuthorization()
            }

            acceptJoinRequest(payload.requesterId, burrowId, reviewerId)

            call.respond(HttpStatusCode.OK)
        }

        // POST /groups/{id}/requests/deny
        // Deny a join request (host/moderator only)
        post("/deny") {
            val burrowId = call.urlParameter("id")
            val reviewerId = call.userID
            val payload = call.receive<ReviewRequestPayload>()

            // Check that reviewer is at least a moderator
            val membership = getMembership(reviewerId, burrowId) ?: throw InvalidAuthorization()

            if (membership.role == BurrowRole.MEMBER) {
                throw InvalidAuthorization()
            }

            denyJoinRequest(payload.requesterId, burrowId, reviewerId)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /groups/{id}/requests
        // Cancel your own join request
        delete {
            val burrowId = call.urlParameter("id")
            val userId = call.userID

            cancelJoinRequest(userId, burrowId)

            call.respond(HttpStatusCode.OK)
        }

        // GET /groups/{id}/requests/count
        // Get count of pending requests for a burrow (host/moderator only)
        get("/count") {
            val burrowId = call.urlParameter("id")
            val userId = call.userID

            // Check that user is at least a moderator
            val membership = getMembership(userId, burrowId) ?: throw InvalidAuthorization()

            if (membership.role == BurrowRole.MEMBER) {
                throw InvalidAuthorization()
            }

            val count = getPendingRequestCount(burrowId)
            call.respond(mapOf("count" to count))
        }
    }

    // Routes under /requests (not scoped to a specific burrow)
    route("/requests") {
        // GET /requests
        // Get all join requests for the authenticated user
        get {
            val userId = call.userID
            val status = call.optionalEnumQueryParameter<JoinRequestStatus>("status")

            val requests = getJoinRequestsForUser(userId, status)
            call.respond(requests)
        }
    }
}
