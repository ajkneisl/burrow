package app.burrow.features.report

import app.burrow.api.throwIfNotEmpty
import app.burrow.api.verify.verify
import app.burrow.features.account.models.userID
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post

/** routes involving reports. */
val REPORT_ROUTES: Route.() -> Unit = {
    // POST /report
    // create a report
    post {
        val report = call.receive<SubmittedReport>()

        report.verify().throwIfNotEmpty()

        val reportID = createReport(call.userID, report)

        call.respond(reportID.toString())
    }
}
