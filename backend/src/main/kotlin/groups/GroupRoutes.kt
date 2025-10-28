package app.burrow.groups

import app.burrow.account.models.userID
import app.burrow.errors.InvalidArguments
import app.burrow.errors.InvalidAuthorization
import app.burrow.errors.NotFound
import app.burrow.errors.ServerError
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
import app.burrow.optionalLongQueryParameter
import app.burrow.queryParameter
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import io.ktor.util.date.getTimeMillis
import java.time.LocalDateTime
import java.time.YearMonth

/**
 * All routes relating to [app.burrow.groups.models.GroupMeeting]s.
 *
 * All routes are inherently authorized.
 */
val GROUP_ROUTES: Route.() -> Unit = {
    // GET /groups/heatmap
    // get a heatmap of groups created this month
    get("/heatmap") {
        val currentDate = LocalDateTime.now()

        val year = call.parameters["year"]?.toIntOrNull() ?: currentDate.year
        val month = call.parameters["month"]?.toIntOrNull() ?: currentDate.monthValue
        val range = call.parameters["range"]?.toLongOrNull() ?: 2

        if (range !in 0..12) throw ServerError(400, "range must be between 0 and 12.")

        val start = YearMonth.of(year, month)
        val end = start.plusMonths(range)

        call.respond(getHeatmapRange(start, end))
    }

    // GET /groups
    // get all group meetings
    get {
        val user = call.userID
        val type =
            call.request.queryParameters["type"]
                ?.runCatching { GroupType.valueOf(uppercase()) }
                ?.getOrNull()

        call.respond(getMeetings(user, type))
    }

    // GET /groups/schedule
    // get the three most recent meetings
    get("/schedule") { call.respond(getUserMeetings(call.userID)) }

    // GET /groups/bookmarks
    // get the most recent bookmarks
    get("/bookmarks") { call.respond(getUserBookmarks(call.userID)) }

    // GET /groups/search
    // search among the stars
    get("/search") {
        val searchQuery = call.queryParameter("query")
        val date = call.optionalLongQueryParameter("date")

        call.respond(searchMeetings(searchQuery, date, call.userID))
    }

    // POST /groups
    // create a meeting
    post {
        val group = call.receive<SubmittedGroupMeeting>()
        val errors = group.validateSubmittedGroupMeeting()

        if (errors.isNotEmpty()) {
            return@post call.respond(HttpStatusCode.BadRequest, mapOf("errors" to errors))
        }

        val createdGroup = createGroupMeeting(call.userID, group)

        call.respond(createdGroup)
    }

    // CRUD /groups/{id}
    // manage an individual meeting
    route("/{id}") {
        // DELETE /groups/{id}
        // delete an individual meeting
        delete {
            val id = call.urlParameter("id")

            val meeting = getMeetingResponse(id, call.userID) ?: return@delete throw NotFound()

            if (meeting.meeting.owner != call.userID) throw InvalidAuthorization()

            deleteMeeting(id)

            call.respond(HttpStatusCode.OK)
        }

        // PATCH /groups/{id}
        // update an individual meeting
        patch {
            val user = call.userID
            val id = call.urlParameter("id")

            val meeting = getMeeting(id) ?: return@patch call.respond(HttpStatusCode.NotFound)

            // the user is NOT the owner
            if (meeting.owner != user) throw InvalidArguments()

            if (getTimeMillis() > meeting.endTime)
                throw ServerError(400, "You cannot edit a meeting that's in the past.")

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
