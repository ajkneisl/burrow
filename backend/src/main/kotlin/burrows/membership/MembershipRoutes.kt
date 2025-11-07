package app.burrow.burrows.membership

import app.burrow.account.models.userID
import app.burrow.InvalidAuthorization
import app.burrow.NotFound
import app.burrow.Error
import app.burrow.burrows.models.BurrowMemberStatus
import app.burrow.burrows.models.BurrowRole
import app.burrow.burrows.getBurrow
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import kotlinx.serialization.Serializable

/** Routes relating to a user's membership. */
fun Route.membershipRoutes() {
    // GET /groups/{id}/attendees
    // get all attendees for this group
    get("/attendees") {
        val id = call.urlParameter("id")
        val attendees = getAttendees(id)

        // must be in the group to see the members!
        val inGroup =
            attendees.any { (membership) ->
                membership.userID == call.userID && membership.status == BurrowMemberStatus.JOINED
            }

        if (!inGroup) {
            return@get call.respond(HttpStatusCode.Forbidden)
        }

        call.respond(getAttendees(id))
    }

    // POST /groups/{id}/join
    // joins a meeting
    post("/join") {
        val id = call.urlParameter("id")

        joinMeeting(call.userID, id)

        call.respond(HttpStatusCode.OK)
    }

    // POST /groups/{id}/leave
    // leaves a meeting
    post("/leave") {
        val id = call.urlParameter("id")

        leaveMeeting(call.userID, id)

        call.respond(HttpStatusCode.OK)
    }

    /**
     * Payload for updating a user's role.
     *
     * @param userId The user to update the role for.
     * @param role The updated role.
     */
    @Serializable data class UpdateRolePayload(val userId: String, val role: BurrowRole)

    // PATCH /groups/{id}/role
    // adjust the role of a user
    patch("/role") {
        val id = call.urlParameter("id")
        val meeting = getBurrow(id) ?: throw NotFound()

        // must be owner to change someone's role
        if (meeting.ownerID != call.userID) throw InvalidAuthorization()

        val payload = call.receive<UpdateRolePayload>()

        changeRole(id, payload.userId, payload.role)

        call.respond(HttpStatusCode.OK)
    }

    /**
     * Payload for updating a user's status.
     *
     * @param userId The user to update the status for.
     */
    @Serializable data class UpdateStatusPayload(val userId: String)

    // PATCH /groups/{id}/status
    // ban or unban a user
    patch("/status") {
        val id = call.urlParameter("id")
        val payload = call.receive<UpdateStatusPayload>()

        val moderatorMembership = getMembership(call.userID, id)
        if (moderatorMembership == null || moderatorMembership.role == BurrowRole.MEMBER)
            throw InvalidAuthorization()

        val membership =
            getMembership(payload.userId, id)
                ?: throw Error(400, "User is not in the meeting.")

        if (membership.status == BurrowMemberStatus.BANNED) {
            unBanUser(payload.userId, id)
        } else {
            banUser(call.userID, payload.userId, id)
        }

        call.respond(HttpStatusCode.OK)
    }
}
