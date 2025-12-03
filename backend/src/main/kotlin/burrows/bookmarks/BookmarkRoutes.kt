package app.burrow.burrows.bookmarks

import app.burrow.account.models.userID
import app.burrow.queryParameter
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.put

// ROUTE /burrows/{id}/bookmark
// manage bookmarks
val BOOKMARK_ROUTES: Route.() -> Unit = {
    // PUT /burrows/{id}/bookmark
    // create a bookmark
    put {
        val id = call.urlParameter("id")

        createBookmark(call.userID, id)

        call.respond(HttpStatusCode.OK)
    }

    // DELETE /burrows/{id}/bookmark
    // remove a bookmark
    delete {
        val id = call.urlParameter("id")

        deleteBookmark(call.userID, id)

        call.respond(HttpStatusCode.OK)
    }
}
