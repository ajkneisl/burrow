package app.burrow.groups

import app.burrow.groups.bookmarks.bookmarkRoutes
import app.burrow.groups.membership.getUserBookmarks
import app.burrow.groups.membership.getUserMeetings
import app.burrow.groups.membership.membershipRoutes
import app.burrow.groups.models.GroupType
import app.burrow.groups.models.SubmittedGroupMeeting
import app.burrow.groups.models.createGroupMeeting
import app.burrow.groups.models.deleteMeeting
import app.burrow.groups.models.getMeeting
import app.burrow.groups.models.getMeetingResponse
import app.burrow.groups.models.getMeetings
import app.burrow.groups.models.searchMeetings
import app.burrow.groups.models.updateMeeting
import app.burrow.groups.models.validateSubmittedGroupMeeting
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route

/**
 * All routes relating to [app.burrow.groups.models.GroupMeeting]s.
 *
 * All routes are inherently authorized.
 */
val GROUP_ROUTES: Route.() -> Unit = {
    // GET /groups
    // get all group meetings
    get {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@get call.respond(HttpStatusCode.Forbidden)
        val type =
            call.request.queryParameters["type"]
                ?.runCatching { GroupType.valueOf(uppercase()) }
                ?.getOrNull()

        call.respond(getMeetings(user, type))
    }

    // GET /groups/schedule
    // get the three most recent meetings
    get("/schedule") {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@get call.respond(HttpStatusCode.Forbidden)

        call.respond(getUserMeetings(user))
    }

    // GET /groups/bookmarks
    // get the most recent bookmarks
    get("/bookmarks") {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@get call.respond(HttpStatusCode.Forbidden)

        call.respond(getUserBookmarks(user))
    }

    // GET /groups/search
    // search among the stars
    get("/search") {
        call.principal<JWTPrincipal>()?.subject ?: return@get call.respond(HttpStatusCode.Forbidden)

        val searchQuery =
            call.request.queryParameters["query"]
                ?: return@get call.respond(HttpStatusCode.BadRequest)

        val date = call.request.queryParameters["date"]?.toLongOrNull()

        call.respond(searchMeetings(searchQuery, date))
    }

    // POST /groups
    // create a meeting
    post {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@post call.respond(HttpStatusCode.Forbidden)

        val group = call.receive<SubmittedGroupMeeting>()
        val errors = group.validateSubmittedGroupMeeting()

        if (errors.isNotEmpty()) {
            return@post call.respond(HttpStatusCode.BadRequest, mapOf("errors" to errors))
        }

        val createdGroup = createGroupMeeting(user, group)

        call.respond(createdGroup)
    }

    // CRUD /groups/{id}
    // manage an individual meeting
    route("/{id}") {
        // DELETE /groups/{id}
        // delete an individual meeting
        delete {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@delete call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)

            val meeting =
                getMeetingResponse(id, user) ?: return@delete call.respond(HttpStatusCode.NotFound)

            if (meeting.meeting.owner != user) {
                return@delete call.respond(HttpStatusCode.Forbidden)
            }

            deleteMeeting(id)

            call.respond(HttpStatusCode.OK)
        }

        // PATCH /groups/{id}
        // update an individual meeting
        patch {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@patch call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@patch call.respond(HttpStatusCode.BadRequest)

            val meeting = getMeeting(id) ?: return@patch call.respond(HttpStatusCode.NotFound)

            // the user is NOT the owner
            if (meeting.owner != user) {
                return@patch call.respond(HttpStatusCode.Forbidden)
            }

            val group = call.receive<SubmittedGroupMeeting>()
            val errors = group.validateSubmittedGroupMeeting()

            if (errors.isNotEmpty()) {
                return@patch call.respond(HttpStatusCode.BadRequest, mapOf("errors" to errors))
            }

            updateMeeting(id, group)

            call.respond(HttpStatusCode.OK)
        }

        membershipRoutes()
        bookmarkRoutes()
    }
}
