package app.burrow.report

import app.burrow.ServerError
import app.burrow.account.models.requireUserID
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post

val REPORT_ROUTES: Route.() -> Unit = {
    // POST /report
    // create a report
    post {
        val userId = call.requireUserID()
        val report = call.receive<SubmittedReport>()

        if (!report.validate()) throw ServerError(400, "There's an issue with your report.")

        val reportId = createReport(userId, report)

        call.respond(reportId.toString())
    }
}
