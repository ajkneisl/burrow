package app.burrow.account

import app.burrow.account.models.User
import app.burrow.account.models.authorizedUser
import app.burrow.account.models.retrieveUser
import app.burrow.account.models.updateUser
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receiveParameters
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put

/** All routes relating to [User] */
val USER_ROUTES: Route.() -> Unit = {
    authenticate("primary") {
        /** Retrieve user information from token. */
        get { call.respond(call.authorizedUser()) }

        /** Update an attribute on a [User]. */
        post {
            val principal = call.principal<JWTPrincipal>()
            val parameters = call.receiveParameters()

            val id = principal?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)

            val key = parameters["key"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            val value = parameters["value"] ?: return@post call.respond(HttpStatusCode.BadRequest)

            val isValid =
                when (key.lowercase()) {
                    "name" -> Regex("^[A-Za-z][A-Za-z\\s'-]{0,49}\$").matches(value)
                    "phone" -> Regex("^(?:\\D*\\d\\D*){10}\$").matches(value)

                    else -> false
                }

            if (!isValid) return@post call.respond(HttpStatusCode.BadRequest)

            updateUser(id, key, value)

            call.respond(HttpStatusCode.OK)
        }
    }

    /** Log in with a Google authentication token. */
    put("/login") {
        val body = call.receiveText()
        val user = retrieveUser(body)

        if (user == null) {
            call.respond(HttpStatusCode.BadRequest)
        } else {
            call.respond(user)
        }
    }
}
