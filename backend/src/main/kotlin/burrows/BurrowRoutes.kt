package app.burrow.burrows

import app.burrow.Error
import app.burrow.InvalidArguments
import app.burrow.InvalidAuthorization
import app.burrow.account.models.userID
import app.burrow.burrows.bookmarks.bookmarkRoutes
import app.burrow.burrows.invites.inviteRoutes
import app.burrow.burrows.invites.joinRequestRoutes
import app.burrow.burrows.membership.getUserBookmarks
import app.burrow.burrows.membership.getUserSchedule
import app.burrow.burrows.membership.membershipRoutes
import app.burrow.burrows.models.BurrowKind
import app.burrow.burrows.models.SubmittedBurrow
import app.burrow.burrows.models.SubmittedProjectBurrow
import app.burrow.burrows.models.SubmittedStudyEventBurrow
import app.burrow.optionalEnumQueryParameter
import app.burrow.optionalIntQueryParameter
import app.burrow.optionalLongQueryParameter
import app.burrow.queryParameter
import app.burrow.throwIfNotEmpty
import app.burrow.throwIfNull
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
 * All routes relating to [app.burrow.groups.Burrow]s.
 *
 * All routes are inherently authorized.
 */
val BURROW_ROUTES: Route.() -> Unit = {
    // GET /groups
    // get all burrows
    get {
        val page = call.optionalIntQueryParameter("page") ?: 1
        val type = call.optionalEnumQueryParameter<BurrowKind>("type")

        call.respond(searchMeetings(page = page, kind = type, requestingUserID = call.userID))
    }

    // GET /groups/heatmap
    // get a heatmap of groups created this month
    get("/heatmap") {
        val currentDate = LocalDateTime.now()

        val year = call.parameters["year"]?.toIntOrNull() ?: currentDate.year
        val month = call.parameters["month"]?.toIntOrNull() ?: currentDate.monthValue
        val range = call.parameters["range"]?.toLongOrNull() ?: 2

        if (range !in 0..12) throw Error(400, "range must be between 0 and 12.")

        val start = YearMonth.of(year, month)
        val end = start.plusMonths(range)

        call.respond(getHeatmapRange(start, end))
    }

    // GET /groups/schedule
    // get the three most recent meetings
    get("/schedule") { call.respond(getUserSchedule(call.userID)) }

    // GET /groups/bookmarks
    // get the most recent bookmarks
    get("/bookmarks") { call.respond(getUserBookmarks(call.userID)) }

    // GET /burrows/search
    // search among the stars
    get("/search") {
        val searchQuery = call.queryParameter("query")
        val type = call.optionalEnumQueryParameter<BurrowKind>("type")
        val page = call.optionalIntQueryParameter("page") ?: 1

        val startDate = call.optionalLongQueryParameter("start")
        val endDate = call.optionalLongQueryParameter("end")

        val range =
            if (startDate != null && endDate != null) {
                startDate..endDate
            } else {
                null
            }

        call.respond(
            searchMeetings(
                page = page,
                kind = type,
                search = searchQuery,
                dateRange = range,
                requestingUserID = call.userID,
            )
        )
    }

    // POST /burrows
    // create a Burrow
    post {
        when (val submittedBurrow = call.receive<SubmittedBurrow>()) {
            is SubmittedProjectBurrow -> {
                submittedBurrow.validateSubmittedBurrow().throwIfNotEmpty()
                call.respond(createProjectBurrow(call.userID, submittedBurrow))
            }

            is SubmittedStudyEventBurrow -> {
                submittedBurrow.validateSubmittedBurrow().throwIfNotEmpty()
                call.respond(createBurrow(call.userID, submittedBurrow))
            }
        }
    }

    // CRUD /groups/{id}
    // manage an individual meeting
    route("/{id}") {
        // DELETE /groups/{id}
        // delete an individual meeting
        delete {
            val id = call.urlParameter("id")

            val meeting = getBurrowResponse(id, call.userID).throwIfNull()

            if (meeting.burrow.ownerID != call.userID) throw InvalidAuthorization()

            deleteMeeting(id)

            call.respond(HttpStatusCode.OK)
        }

        // PATCH /groups/{id}
        // update an individual meeting
        patch {
            val user = call.userID
            val id = call.urlParameter("id")

            val meeting = getBurrow(id).throwIfNull()

            // the user is NOT the owner
            if (meeting.ownerID != user) throw InvalidArguments()

            if (getTimeMillis() > meeting.endTime)
                throw Error(400, "You cannot edit a meeting that's in the past.")

            val submittedBurrow = call.receive<SubmittedBurrow>()

            when (submittedBurrow) {
                is SubmittedProjectBurrow -> {
                    submittedBurrow.validateSubmittedBurrow().throwIfNotEmpty()
                    updateProjectBurrow(id, submittedBurrow)
                }
                is SubmittedStudyEventBurrow -> {
                    submittedBurrow.validateSubmittedBurrow().throwIfNotEmpty()
                    updatedBurrow(id, submittedBurrow)
                }
            }

            call.respond(HttpStatusCode.OK)
        }

        membershipRoutes()
        bookmarkRoutes()
    }

    inviteRoutes()
    joinRequestRoutes()
}
