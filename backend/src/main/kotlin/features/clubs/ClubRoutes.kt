package app.burrow.features.clubs

import app.burrow.api.InvalidAuthorization
import app.burrow.api.MultiError
import app.burrow.api.NotFound
import app.burrow.api.optionalEnumQueryParameter
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.throwIfNotEmpty
import app.burrow.api.throwIfNull
import app.burrow.api.urlParameter
import app.burrow.api.verify.toKotlinValue
import kotlinx.serialization.json.JsonObject
import app.burrow.api.verify.verify
import app.burrow.api.verify.verifyField
import app.burrow.features.account.isBlockedBy
import app.burrow.features.account.models.getUserByUsername
import app.burrow.features.account.models.userID
import app.burrow.features.burrows.searchBurrows
import app.burrow.features.clubs.members.changeClubRole
import app.burrow.features.clubs.members.getClubByName
import app.burrow.features.clubs.members.getClubMembers
import app.burrow.features.clubs.members.getUserClubs
import app.burrow.features.clubs.members.joinClub
import app.burrow.features.clubs.members.kickClubMember
import app.burrow.features.clubs.members.leaveClub
import app.burrow.features.clubs.members.requireClubAdmin
import app.burrow.features.clubs.members.requireClubModerator
import app.burrow.features.clubs.models.SubmittedClub
import app.burrow.features.clubs.models.enums.ClubCategory
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.clubs.models.getClubResponse
import app.burrow.features.invites.InviteType
import app.burrow.features.invites.cancelInvite
import app.burrow.features.invites.createInvite
import app.burrow.features.invites.getInvitesForTarget
import app.burrow.features.requests.acceptJoinRequest
import app.burrow.features.requests.cancelJoinRequest
import app.burrow.features.requests.denyJoinRequest
import app.burrow.features.requests.getJoinRequests
import app.burrow.features.requests.getPendingRequestCount
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

// ROUTE /clubs
// manage clubs
val CLUB_ROUTES: Route.() -> Unit = {
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

        submittedClub.verify().throwIfNotEmpty()

        val club = createClub(userID, submittedClub)
        call.respond(HttpStatusCode.Created, club)
    }

    // POST /clubs/verify
    // verify fields of a club
    post("/verify") {
        val partialClub = call.receive<JsonObject>()

        partialClub
            .flatMap { (field, value) -> verifyField<SubmittedClub>(field, value.toKotlinValue()) }
            .throwIfNotEmpty()

        call.respond(HttpStatusCode.OK)
    }

    // GET /clubs/mine
    // get clubs the current user is a member of
    get("/mine") { call.respond(getUserClubs(call.userID)) }

    // ROUTE /clubs/{name}
    route("/{name}") {
        // GET /clubs/{name}
        get {
            val name = call.urlParameter("name")
            val response = getClubResponse(name, call.userID).throwIfNull()
            call.respond(response)
        }

        // PATCH /clubs/{name}
        // update a club (admin only)
        patch {
            val name = call.urlParameter("name")
            val club = getClubByName(name).throwIfNull()

            if (club.ownerID != call.userID) {
                call.requireClubAdmin(club.id)
            }

            val submittedClub = call.receive<SubmittedClub>()
            updateClub(club.id, submittedClub)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /clubs/{name}
        // delete a club (owner only)
        delete {
            val name = call.urlParameter("name")
            val club = getClubByName(name).throwIfNull()

            if (club.ownerID != call.userID) throw InvalidAuthorization()

            deleteClub(club.id)

            call.respond(HttpStatusCode.OK)
        }

        // GET /clubs/{name}/burrows
        // list burrows owned by this club
        get("/burrows") {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()

            val result = searchBurrows {
                clubID = club.id
                requestingUserID = call.userID
                limit = 100
                offset = 0
            }

            call.respond(result.contents)
        }

        CLUB_MEMBERSHIP_ROUTES()
        CLUB_INVITE_ROUTES()
        CLUB_JOIN_REQUEST_ROUTES()
        CLUB_PHOTO_ROUTES()
    }
}

// ROUTE /clubs/{name}
// specifically manage memberships in a club
val CLUB_MEMBERSHIP_ROUTES: Route.() -> Unit = {
    // GET /clubs/{name}/members
    // get members of a club
    get("/members") {
        val club = getClubByName(call.urlParameter("name")).throwIfNull()
        val page = call.optionalIntQueryParameter("page") ?: 1

        call.respond(getClubMembers(club.id, page))
    }

    // POST /clubs/{name}/join
    // join a club
    post("/join") {
        val club = getClubByName(call.urlParameter("name")).throwIfNull()

        joinClub(call.userID, club.id)

        call.respond(HttpStatusCode.OK)
    }

    // POST /clubs/{name}/leave
    // leave a club
    post("/leave") {
        val club = getClubByName(call.urlParameter("name")).throwIfNull()

        leaveClub(call.userID, club.id)

        call.respond(HttpStatusCode.OK)
    }

    /**
     * Payload to update a club's role.
     *
     * @param userID The user to update.
     * @param role The user's pre-defined role.
     * @param roleName The custom name the user's role should have.
     */
    @Serializable
    data class UpdateClubRolePayload(
        val userID: String,
        val role: ClubRole,
        val roleName: String = "",
    )

    // PATCH /clubs/{name}/role
    // change a member's role
    patch("/role") {
        val club = getClubByName(call.urlParameter("name")).throwIfNull()
        val payload = call.receive<UpdateClubRolePayload>()
        call.requireClubAdmin(club.id)

        val roleName =
            payload.roleName.ifBlank {
                payload.role.name.lowercase().replaceFirstChar { it.uppercase() }
            }

        if (!roleName.matches(Regex("^[A-Za-z0-9_ -]{3,16}$")))
            throw MultiError(
                400,
                listOf(
                    "Role name must be 3-16 characters and only contain letters, numbers, underscores, hyphens, and spaces."
                ),
            )

        changeClubRole(club.id, payload.userID, payload.role, roleName)
        call.respond(HttpStatusCode.OK)
    }

    /**
     * Payload to kick a user.
     *
     * @param userID The user to kick.
     */
    @Serializable data class KickPayload(val userID: String)

    // PATCH /clubs/{name}/kick
    // kick a member
    patch("/kick") {
        val club = getClubByName(call.urlParameter("name")).throwIfNull()
        call.requireClubModerator(club.id)

        val payload = call.receive<KickPayload>()

        kickClubMember(call.userID, payload.userID, club.id)

        call.respond(HttpStatusCode.OK)
    }
}

// ROUTE /club/{name}/invites
// manage a specific club's invites
private val CLUB_INVITE_ROUTES: Route.() -> Unit = {
    route("/invites") {
        /**
         * Payload to invite a user.
         *
         * @param inviteeID The ID of the user to invite.
         * @param expiresAt When the invite expires.
         */
        @Serializable
        data class CreateClubInvitePayload(val inviteeID: String, val expiresAt: Long? = null)

        // POST /clubs/{name}/invites
        // invite a user
        post {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()
            call.requireClubModerator(club.id)

            val payload = call.receive<CreateClubInvitePayload>()

            val retrievedUser = getUserByUsername(payload.inviteeID)

            // not found if user is blocked
            if (isBlockedBy(retrievedUser.id, call.userID))
                throw NotFound()

            createInvite(
                inviterID = call.userID,
                inviteeID = payload.inviteeID,
                targetID = club.id,
                inviteType = InviteType.CLUB,
                expiresAt = payload.expiresAt,
            )

            call.respond(HttpStatusCode.Created)
        }

        // GET /clubs/{name}/invites
        // list invites
        get {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()
            val page = call.optionalIntQueryParameter("page") ?: 1

            call.requireClubModerator(club.id)

            call.respond(getInvitesForTarget(club.id, InviteType.CLUB, page))
        }

        // DELETE /clubs/{name}/invites/{inviteeID}
        // cancel an invite
        delete("/{inviteeID}") {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()
            val inviteeID = call.urlParameter("inviteeID")

            cancelInvite(call.userID, inviteeID, club.id, InviteType.CLUB)

            call.respond(HttpStatusCode.OK)
        }
    }
}

// ROUTE /clubs/{name}/requests
// handle club join requests
private val CLUB_JOIN_REQUEST_ROUTES: Route.() -> Unit = {
    route("/requests") {
        // GET /clubs/{name}/requests
        // list pending request
        get {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()
            val page = call.optionalIntQueryParameter("page") ?: 1

            call.requireClubModerator(club.id)

            call.respond(getJoinRequests(club.id, InviteType.CLUB, page))
        }

        /**
         * Accept or deny a request to join.
         *
         * @param requesterID The user who's requesting to join.
         */
        @Serializable data class ReviewRequestPayload(val requesterID: String)

        // POST /clubs/{name}/requests/accept
        // accept a request
        post("/accept") {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()
            call.requireClubModerator(club.id)

            val payload = call.receive<ReviewRequestPayload>()
            acceptJoinRequest(payload.requesterID, club.id, InviteType.CLUB, call.userID)

            call.respond(HttpStatusCode.OK)
        }

        // POST /clubs/{name}/requests/deny
        // deny a request
        post("/deny") {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()
            call.requireClubModerator(club.id)

            val payload = call.receive<ReviewRequestPayload>()
            denyJoinRequest(payload.requesterID, club.id, InviteType.CLUB, call.userID)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /clubs/{name}/requests
        // cancel own request
        delete {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()

            cancelJoinRequest(call.userID, club.id, InviteType.CLUB)

            call.respond(HttpStatusCode.OK)
        }

        // GET /clubs/{name}/requests/count
        // count pending requests
        get("/count") {
            val club = getClubByName(call.urlParameter("name")).throwIfNull()

            call.requireClubModerator(club.id)

            val count = getPendingRequestCount(club.id, InviteType.CLUB)

            call.respond(mapOf("count" to count))
        }
    }
}
