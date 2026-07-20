package app.burrow.admin

import app.burrow.admin.log.LOG_ROUTES
import app.burrow.api.Error
import app.burrow.api.query
import app.burrow.api.urlParameter
import app.burrow.features.account.Authorization.ADMIN_AUTH
import app.burrow.features.account.Users
import app.burrow.features.account.models.AccountType
import app.burrow.features.account.models.getUserByID
import app.burrow.features.account.models.updateAccountType
import app.burrow.features.account.models.userID
import app.burrow.features.account.profile.BADGE_ROUTES
import app.burrow.features.articles.ADMIN_ARTICLE_ROUTES
import app.burrow.features.report.getAllReports
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

/**
 * An administrator's account details. This is a regular user account with
 * [AccountType.ADMIN].
 */
@Serializable
data class AdminAccount(
    val id: String,
    val username: String,
    val email: String,
    val accountType: AccountType,
    val createdAt: Long,
)

/** Map a [Users] row to an [AdminAccount]. */
private fun ResultRow.toAdminAccount() =
    AdminAccount(
        id = this[Users.id],
        username = this[Users.username],
        email = this[Users.email],
        accountType = this[Users.accountType],
        createdAt = this[Users.createdAt],
    )

/** Get the authorized administrator's account. */
suspend fun ApplicationCall.administratorAccount(): AdminAccount =
    query { Users.selectAll().where { Users.id eq userID }.singleOrNull() }?.toAdminAccount()
        ?: throw Error(401, "Unauthorized.")

/** All routes involving administrators. */
val ADMIN_ROUTES: Route.() -> Unit = {
    // AUTHENTICATE
    // all admin paths require an ADMIN account type
    authenticate(ADMIN_AUTH) {
        // GET /admin
        // see stuff about yourself :)
        get { call.respond(call.administratorAccount()) }

        // GET /admin/reports
        // see all reports
        get("/reports") { call.respond(getAllReports()) }

        // GET /admin/analytics
        // retrieve basic analytics for burrow
        get("analytics") { call.respond(getAnalytics()) }

        // ROUTE /admin/logs
        // manage and view system logs
        route("/logs", LOG_ROUTES)

        // ROUTE /admin/badges
        route("/badges", BADGE_ROUTES)

        // ROUTE /admin/articles
        // manage articles
        route("/articles", ADMIN_ARTICLE_ROUTES)

        // ROUTE /admin/accounts
        // manage administrator accounts
        route("/accounts") {
            // GET /admin/accounts
            // list all administrators
            get {
                val admins = query {
                    Users.selectAll()
                        .where { Users.accountType eq AccountType.ADMIN }
                        .toList()
                        .map { it.toAdminAccount() }
                }

                call.respond(admins)
            }

            /** A request to change a user's [AccountType]. */
            @Serializable data class UpdateAccountTypeRequest(val accountType: AccountType)

            // POST /admin/accounts/{id}
            // change a user's account type
            post("/{id}") {
                val id = call.urlParameter("id")

                if (id == call.userID) {
                    throw Error(400, "You cannot change your own account type.")
                }

                val (accountType) = call.receive<UpdateAccountTypeRequest>()

                // ensure the user exists
                getUserByID(id)

                updateAccountType(id, accountType)

                call.respond(HttpStatusCode.OK)
            }
        }
    }
}
