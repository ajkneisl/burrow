package app.burrow.burrows.bookmarks

import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.put
import io.ktor.server.routing.route

/** Routes to manage bookmarks on a meeting. */
fun Route.bookmarkRoutes() =
    route("/bookmark") {
        put {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@put call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@put call.respond(HttpStatusCode.BadRequest)

            createBookmark(user, id)

            call.respond(HttpStatusCode.OK)
        }

        delete {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@delete call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)

            deleteBookmark(user, id)

            call.respond(HttpStatusCode.OK)
        }
    }
