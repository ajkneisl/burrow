package app.burrow.admin

import app.burrow.ADMIN_AUTH
import app.burrow.ServerError
import app.burrow.admin.account.Administrator
import app.burrow.admin.account.Permissions
import app.burrow.admin.account.adminLogin
import app.burrow.admin.account.createAdministrator
import app.burrow.admin.account.getAdministrator
import app.burrow.admin.account.requirePermissions
import app.burrow.report.getAllReports
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.http.content.react
import io.ktor.server.http.content.singlePageApplication
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import kotlinx.serialization.Serializable

val ApplicationCall.administrator
    get() = principal<JWTPrincipal>()?.subject ?: throw ServerError(401, "Unauthorized.")

suspend fun ApplicationCall.getAdministrator() =
    getAdministrator(administrator) ?: throw ServerError(401, "Unauthorized.")

/** All routes involving administrators. */
val ADMIN_ROUTES: Route.() -> Unit = {
    /**
     * A request to login to the admin realm.
     *
     * @param username The username for the login request.
     * @param password The password for the login request.
     * @param totp The time based one time password.
     */
    @Serializable
    data class AdminLoginRequest(val username: String, val password: String, val totp: String)

    /**
     * A response to an administrator logging in
     *
     * @param token An authorized JWT token.
     * @param admin The administrator who logged in
     */
    @Serializable data class AdminLoginResponse(val token: String, val admin: Administrator)

    // POST /admin
    // login to the admin
    post {
        val (username, password, totp) = call.receive<AdminLoginRequest>()
        val (token, admin) = adminLogin(username, password, totp)

        call.respond(AdminLoginResponse(token, admin))
    }

    /** A request to create an admin account. */
    @Serializable
    data class CreateAdminRequest(val username: String, val password: String, val email: String)

    // PUT /admin
    // create an admin account
    put {
        val admin = call.getAdministrator()
        admin.requirePermissions(Permissions.MANAGE_ADMIN_USERS)

        val (username, password, email) = call.receive<CreateAdminRequest>()

        val createdAdmin =
            createAdministrator(username, email, password, Permissions.VIEW_DASHBOARD)

        call.respond(createdAdmin)
    }

    // AUTHENTICATE
    // all protected paths for burrow
    authenticate(ADMIN_AUTH) {
        // GET /admin
        // see stuff about yourself :)
        get { call.respond(call.getAdministrator()) }

        // GET /admin/reports
        // see all reports
        get("/reports") { call.respond(getAllReports()) }

        // GET /admin/analytics
        // retrieve basic analytics for burrow
        get("analytics") { call.respond(getAnalytics()) }
    }
}
