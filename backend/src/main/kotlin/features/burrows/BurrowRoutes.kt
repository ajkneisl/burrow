package app.burrow.features.burrows

import app.burrow.api.Error
import app.burrow.api.InvalidAuthorization
import app.burrow.api.optionalBooleanQueryParameter
import app.burrow.api.optionalEnumQueryParameter
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.optionalLongQueryParameter
import app.burrow.api.queryParameter
import app.burrow.api.throwIfNotEmpty
import app.burrow.api.throwIfNull
import app.burrow.api.urlParameter
import app.burrow.api.verify.toKotlinValue
import app.burrow.api.verify.verify
import app.burrow.api.verify.verifyField
import app.burrow.features.account.models.userID
import app.burrow.features.burrows.bookmarks.BOOKMARK_ROUTES
import app.burrow.features.burrows.membership.getUserBookmarks
import app.burrow.features.burrows.membership.getUserSchedule
import app.burrow.features.burrows.membership.membershipRoutes
import app.burrow.features.burrows.models.Burrow
import app.burrow.features.burrows.models.SubmittedBurrow
import app.burrow.features.burrows.models.SubmittedProjectBurrow
import app.burrow.features.burrows.models.SubmittedProjectBurrowVerifier
import app.burrow.features.burrows.models.SubmittedStudyEventBurrow
import app.burrow.features.burrows.models.createBurrow
import app.burrow.features.burrows.models.createProjectBurrow
import app.burrow.features.burrows.models.deleteMeeting
import app.burrow.features.burrows.models.enums.BurrowKind
import app.burrow.features.burrows.models.getBurrow
import app.burrow.features.burrows.models.getBurrowResponse
import app.burrow.features.burrows.models.updateProjectBurrow
import app.burrow.features.burrows.models.updatedBurrow
import app.burrow.features.clubs.members.getClubMembership
import app.burrow.features.clubs.models.enums.ClubRole
import app.burrow.features.invites.inviteRoutes
import app.burrow.features.requests.joinRequestRoutes
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
import kotlinx.serialization.json.JsonObject

/**
 * Check if a user can manage a burrow. Returns true if the user is the direct owner, or if the
 * burrow is club-owned and the user is an admin of that club.
 */
suspend fun canManageBurrow(userID: String, burrow: Burrow): Boolean {
    if (burrow.ownerID == userID) return true

    // Check if the burrow is club-owned and the user is an admin of that club
    val clubID = burrow.clubID ?: return false
    val clubMembership = getClubMembership(userID, clubID)

    return clubMembership != null && clubMembership.role == ClubRole.ADMINISTRATOR
}

/**
 * All routes relating to [app.burrow.groups.Burrow]s.
 *
 * All routes are inherently authorized.
 */
val BURROW_ROUTES: Route.() -> Unit = {
    // GET /burrows
    // get all burrows
    get {
        val page = call.optionalIntQueryParameter("page") ?: 1
        val type = call.optionalEnumQueryParameter<BurrowKind>("type")
        val excludeJoined = call.optionalBooleanQueryParameter("exclude_joined")

        call.respond(
            searchBurrows(page = page) {
                kind = type
                requestingUserID = call.userID
                notJoined = excludeJoined == true
            }
        )
    }

    // GET /burrows/schedule
    // get a user's schedule
    get("/schedule") { call.respond(getUserSchedule(call.userID)) }

    // GET /burrows/bookmarks
    // get a user's bookmarks
    get("/bookmarks") { call.respond(getUserBookmarks(call.userID)) }

    // GET /burrows/map
    // get a list of burrows and their locations to show on a map
    get("/map") { call.respond(getMap(call.userID)) }

    // GET /burrows/heatmap
    // get a heatmap of groups created this month
    get("/heatmap") {
        val currentDate = LocalDateTime.now()

        val year = call.optionalIntQueryParameter("year") ?: currentDate.year
        val month = call.optionalIntQueryParameter("month") ?: currentDate.monthValue
        val range = call.optionalLongQueryParameter("range") ?: 2

        if (range !in 0..12) throw Error(400, "range must be between 0 and 12.")

        val start = YearMonth.of(year, month)
        val end = start.plusMonths(range)

        call.respond(getHeatmapRange(start, end))
    }

    // GET /burrows/search
    // search among the stars
    get("/search") {
        val searchQuery = call.queryParameter("query")
        val type = call.optionalEnumQueryParameter<BurrowKind>("type")
        val page = call.optionalIntQueryParameter("page") ?: 1

        val startDate = call.optionalLongQueryParameter("start")
        val endDate = call.optionalLongQueryParameter("end")

        val bookmarked = call.optionalBooleanQueryParameter("bookmarked")
        val host = call.optionalBooleanQueryParameter("host")
        val ta = call.optionalBooleanQueryParameter("ta")

        val range =
            if (startDate != null && endDate != null) {
                startDate..endDate
            } else {
                null
            }

        call.respond(
            searchBurrows(page) {
                kind = type
                query = searchQuery
                dateRange = range
                requestingUserID = call.userID
                isHostedBy = if (host == true) call.userID else null
                isBookmarked = bookmarked
                isTa = ta == true
            }
        )
    }

    // POST /burrows/verify
    // verify fields of a study/event burrow
    post("/verify") {
        val partialBurrow = call.receive<Map<String, String>>()

        partialBurrow
            .flatMap { (field, value) -> verifyField<SubmittedStudyEventBurrow>(field, value) }
            .throwIfNotEmpty()

        call.respond(HttpStatusCode.OK)
    }

    // POST /burrows/verify/project
    // verify fields of a project burrow
    post("/verify/project") {
        val partialBurrow = call.receive<JsonObject>()
        val verifier = SubmittedProjectBurrowVerifier(isUpdating = false)

        partialBurrow
            .flatMap { (field, value) -> verifier.verifyField(field, value.toKotlinValue()) }
            .throwIfNotEmpty()

        call.respond(HttpStatusCode.OK)
    }

    // POST /burrows
    // create a Burrow
    post {
        when (val submittedBurrow = call.receive<SubmittedBurrow>()) {
            is SubmittedProjectBurrow -> {
                SubmittedProjectBurrowVerifier(isUpdating = false)
                    .verify(submittedBurrow)
                    .throwIfNotEmpty()
                call.respond(createProjectBurrow(call.userID, submittedBurrow))
            }

            is SubmittedStudyEventBurrow -> {
                submittedBurrow.verify().throwIfNotEmpty()
                call.respond(createBurrow(call.userID, submittedBurrow, submittedBurrow.clubID))
            }
        }
    }

    // ROUTE /burrows/{id}
    // manage an individual meeting
    route("/{id}") {
        // DELETE /burrows/{id}
        // delete an individual meeting
        delete {
            val id = call.urlParameter("id")

            val meeting = getBurrowResponse(id, call.userID).throwIfNull()

            if (!canManageBurrow(call.userID, meeting.burrow)) throw InvalidAuthorization()

            deleteMeeting(id)

            call.respond(HttpStatusCode.OK)
        }

        // PATCH /burrows/{id}
        // update an individual meeting
        patch {
            val user = call.userID
            val id = call.urlParameter("id")

            val meeting = getBurrow(id).throwIfNull()

            // the user is NOT the owner / club admin
            if (!canManageBurrow(user, meeting)) throw InvalidAuthorization()

            if (getTimeMillis() > meeting.endTime)
                throw Error(400, "You cannot edit a meeting that's in the past.")

            when (val submittedBurrow = call.receive<SubmittedBurrow>()) {
                is SubmittedProjectBurrow -> {
                    SubmittedProjectBurrowVerifier(isUpdating = true)
                        .verify(submittedBurrow)
                        .throwIfNotEmpty()
                    updateProjectBurrow(id, submittedBurrow)
                }

                is SubmittedStudyEventBurrow -> {
                    submittedBurrow.verify().throwIfNotEmpty()
                    updatedBurrow(id, submittedBurrow)
                }
            }

            call.respond(HttpStatusCode.OK)
        }

        // ROUTE /burrows/{id}/bookmark/
        // manage a bookmark for a burrow
        route("/bookmark", BOOKMARK_ROUTES)

        membershipRoutes()
    }

    inviteRoutes()
    joinRequestRoutes()
}
