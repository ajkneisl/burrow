package app.burrow.features.clubs

import app.burrow.api.InvalidAuthorization
import app.burrow.features.account.models.userID
import app.burrow.features.clubs.members.changeClubRole
import app.burrow.features.clubs.members.getClub
import app.burrow.features.clubs.members.getClubMembers
import app.burrow.features.clubs.members.joinClub
import app.burrow.features.clubs.members.kickClubMember
import app.burrow.features.clubs.members.leaveClub
import app.burrow.features.clubs.members.requireClubAdmin
import app.burrow.features.clubs.members.requireClubModerator
import app.burrow.features.invites.InviteType
import app.burrow.features.invites.cancelInvite
import app.burrow.features.invites.createInvite
import app.burrow.features.invites.getInvitesForTarget
import app.burrow.features.requests.acceptJoinRequest
import app.burrow.features.requests.cancelJoinRequest
import app.burrow.features.requests.denyJoinRequest
import app.burrow.features.requests.getJoinRequests
import app.burrow.features.requests.getPendingRequestCount
import app.burrow.api.optionalEnumQueryParameter
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.throwIfNotEmpty
import app.burrow.api.throwIfNull
import app.burrow.api.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable

fun Route.clubRoutes() {
    // GET /clubs
    // list/search clubs (paginated)
    get {
        val page = call.optionalIntQueryParameter("page") ?: 1
        val category = call.optionalEnumQueryParameter<ClubCategory>("category")
        val searchQuery = call.request.queryParameters["query"]

        call.respond(searchClubs(page, category, searchQuery))
    }

    // POST /clubs
    // create a club
    post {
        val userID = call.userID
        val submittedClub = call.receive<SubmittedClub>()

        submittedClub.verifySubmission(userID).throwIfNotEmpty()

        val club = createClub(userID, submittedClub)
        call.respond(HttpStatusCode.Created, club)
    }

    // ROUTE /clubs/{id}
    route("/{id}") {
        // GET /clubs/{id}
        get {
            val id = call.urlParameter("id")
            val response = getClubResponse(id, call.userID).throwIfNull()
            call.respond(response)
        }

        // PATCH /clubs/{id}
        // update a club (admin only)
        patch {
            val id = call.urlParameter("id")
            val club = getClub(id).throwIfNull()

            if (club.ownerID != call.userID) {
                call.requireClubAdmin(id)
            }

            val submittedClub = call.receive<SubmittedClub>()
            updateClub(id, submittedClub)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /clubs/{id}
        // delete a club (owner only)
        delete {
            val id = call.urlParameter("id")
            val club = getClub(id).throwIfNull()

            if (club.ownerID != call.userID) throw InvalidAuthorization()

            deleteClub(id)

            call.respond(HttpStatusCode.OK)
        }

        clubMembershipRoutes()
        clubInviteRoutes()
        clubJoinRequestRoutes()
    }
}

/** Routes for club membership management. */
private fun Route.clubMembershipRoutes() {
    // GET /clubs/{id}/members
    get("/members") {
        val clubID = call.urlParameter("id")
        val page = call.optionalIntQueryParameter("page") ?: 1

        call.respond(getClubMembers(clubID, page))
    }

    // POST /clubs/{id}/join
    post("/join") {
        val clubID = call.urlParameter("id")
        joinClub(call.userID, clubID)
        call.respond(HttpStatusCode.OK)
    }

    // POST /clubs/{id}/leave
    post("/leave") {
        val clubID = call.urlParameter("id")
        leaveClub(call.userID, clubID)
        call.respond(HttpStatusCode.OK)
    }

    @Serializable
    data class UpdateClubRolePayload(
        val userID: String,
        val role: ClubRole,
        val roleName: String = "",
    )

    // PATCH /clubs/{id}/role
    // change a member's role (admin only)
    patch("/role") {
        val clubID = call.urlParameter("id")
        call.requireClubAdmin(clubID)

        val payload = call.receive<UpdateClubRolePayload>()
        val roleName = payload.roleName.ifBlank { payload.role.name.lowercase().replaceFirstChar { it.uppercase() } }

        changeClubRole(clubID, payload.userID, payload.role, roleName)
        call.respond(HttpStatusCode.OK)
    }

    @Serializable
    data class KickPayload(val userID: String)

    // PATCH /clubs/{id}/kick
    // kick a member (mod+ only)
    patch("/kick") {
        val clubID = call.urlParameter("id")
        call.requireClubModerator(clubID)

        val payload = call.receive<KickPayload>()
        kickClubMember(call.userID, payload.userID, clubID)
        call.respond(HttpStatusCode.OK)
    }
}

/** Routes for club invite management. */
private fun Route.clubInviteRoutes() {
    route("/invites") {
        @Serializable
        data class CreateClubInvitePayload(val inviteeId: String, val expiresAt: Long? = null)

        // POST /clubs/{id}/invites
        // create an invite (mod+ only)
        post {
            val clubID = call.urlParameter("id")
            call.requireClubModerator(clubID)

            val payload = call.receive<CreateClubInvitePayload>()

            createInvite(
                inviterId = call.userID,
                inviteeId = payload.inviteeId,
                targetId = clubID,
                inviteType = InviteType.CLUB,
                expiresAt = payload.expiresAt,
            )

            call.respond(HttpStatusCode.Created)
        }

        // GET /clubs/{id}/invites
        // list invites (mod+ only)
        get {
            val clubID = call.urlParameter("id")
            val page = call.optionalIntQueryParameter("page") ?: 1

            call.requireClubModerator(clubID)

            call.respond(getInvitesForTarget(clubID, InviteType.CLUB, page))
        }

        // DELETE /clubs/{id}/invites/{inviteeId}
        // cancel an invite
        delete("/{inviteeId}") {
            val clubID = call.urlParameter("id")
            val inviteeID = call.urlParameter("inviteeId")

            cancelInvite(call.userID, inviteeID, clubID, InviteType.CLUB)

            call.respond(HttpStatusCode.OK)
        }
    }
}

/** Routes for club join request management. */
private fun Route.clubJoinRequestRoutes() {
    route("/requests") {
        // GET /clubs/{id}/requests
        // list pending requests (mod+ only)
        get {
            val clubID = call.urlParameter("id")
            val page = call.optionalIntQueryParameter("page") ?: 1

            call.requireClubModerator(clubID)

            call.respond(getJoinRequests(clubID, InviteType.CLUB, page))
        }

        @Serializable
        data class ReviewRequestPayload(val requesterId: String)

        // POST /clubs/{id}/requests/accept
        // accept a request (mod+ only)
        post("/accept") {
            val clubID = call.urlParameter("id")
            call.requireClubModerator(clubID)

            val payload = call.receive<ReviewRequestPayload>()
            acceptJoinRequest(payload.requesterId, clubID, InviteType.CLUB, call.userID)

            call.respond(HttpStatusCode.OK)
        }

        // POST /clubs/{id}/requests/deny
        // deny a request (mod+ only)
        post("/deny") {
            val clubID = call.urlParameter("id")
            call.requireClubModerator(clubID)

            val payload = call.receive<ReviewRequestPayload>()
            denyJoinRequest(payload.requesterId, clubID, InviteType.CLUB, call.userID)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /clubs/{id}/requests
        // cancel own request
        delete {
            val clubID = call.urlParameter("id")
            cancelJoinRequest(call.userID, clubID, InviteType.CLUB)
            call.respond(HttpStatusCode.OK)
        }

        // GET /clubs/{id}/requests/count
        // count pending requests (mod+ only)
        get("/count") {
            val clubID = call.urlParameter("id")
            call.requireClubModerator(clubID)

            val count = getPendingRequestCount(clubID, InviteType.CLUB)
            call.respond(mapOf("count" to count))
        }
    }
}
