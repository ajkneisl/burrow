package app.burrow.report

import app.burrow.account.models.userID
import app.burrow.errors.ServerError
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

        if (!report.validate()) throw ServerError(400, "There's an issue with your report.")

        val reportId = createReport(call.userID, report)

        call.respond(reportId.toString())
    }
}
