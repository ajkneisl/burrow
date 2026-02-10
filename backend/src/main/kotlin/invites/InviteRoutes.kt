package app.burrow.invites

import app.burrow.features.account.models.userID
import app.burrow.features.burrows.membership.requireModerator
import app.burrow.api.optionalEnumQueryParameter
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.urlParameter
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

// ROUTES /burrows/{id}/invites, /invites
// manage invites
fun Route.inviteRoutes() {
    // ROUTE /burrows/{id}/invites
    // routes interacting with invites for a specific burrow
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
        // create an invitation to a burrow
        post {
            val burrowID = call.urlParameter("id")
            val inviterID = call.userID
            val payload = call.receive<CreateInvitePayload>()

            call.requireModerator(burrowID)

            createInvite(
                inviterID = inviterID,
                inviteeID = payload.inviteeId,
                targetID = burrowID,
                inviteType = InviteType.BURROW,
                expiresAt = payload.expiresAt,
            )

            call.respond(HttpStatusCode.Created)
        }

        // GET /groups/{id}/invites
        // get all pending invites for a burrow (host/moderator only)
        get {
            val burrowID = call.urlParameter("id")
            val page = call.optionalIntQueryParameter("page") ?: 1
            call.requireModerator(burrowID)

            val invites = getInvitesForTarget(burrowID, InviteType.BURROW, page)
            call.respond(invites)
        }

        // DELETE /groups/{id}/invites/{inviteeID}
        // cancel an invitation (inviter only)
        delete("/{inviteeId}") {
            val burrowID = call.urlParameter("id")
            val inviteeID = call.urlParameter("inviteeID")
            val inviterID = call.userID

            cancelInvite(inviterID, inviteeID, burrowID, InviteType.BURROW)

            call.respond(HttpStatusCode.OK)
        }
    }

    // ROUTE /invites
    // invites not relating to a specific burrow
    route("/invites") {
        // GET /invites/received
        // get all invites received by the authenticated user
        get("/received") {
            val userID = call.userID
            val status = call.optionalEnumQueryParameter<InviteStatus>("status")
            val type = call.optionalEnumQueryParameter<InviteType>("type")

            val invites = getReceivedInvites(userID, status, type)
            call.respond(invites)
        }

        // GET /invites/sent
        // get all invites sent by the authenticated user
        get("/sent") {
            val userID = call.userID
            val status = call.optionalEnumQueryParameter<InviteStatus>("status")
            val type = call.optionalEnumQueryParameter<InviteType>("type")

            val invites = getSentInvites(userID, status, type)
            call.respond(invites)
        }

        // GET /invites/count
        // get count of pending invites for the authenticated user
        get("/count") {
            val userId = call.userID
            val count = getPendingInviteCountForUser(userId)

            call.respond(mapOf("count" to count))
        }

        // ROUTE /invites/{id}
        // personally manage invites to a user
        route("/{id}") {
            // POST /invites/{id}/accept
            // accept an invitation
            post("/accept") {
                val targetId = call.urlParameter("id")
                val userId = call.userID
                val type = call.optionalEnumQueryParameter<InviteType>("type") ?: InviteType.BURROW

                acceptInvite(userId, targetId, type)

                call.respond(HttpStatusCode.OK)
            }

            // POST /invites/{id}/decline
            // decline an invitation
            post("/decline") {
                val targetId = call.urlParameter("id")
                val userId = call.userID
                val type = call.optionalEnumQueryParameter<InviteType>("type") ?: InviteType.BURROW

                declineInvite(userId, targetId, type)

                call.respond(HttpStatusCode.OK)
            }
        }
    }
}
