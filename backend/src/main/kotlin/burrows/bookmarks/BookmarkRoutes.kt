package app.burrow.burrows.bookmarks

import app.burrow.account.models.userID
import app.burrow.queryParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.put

// ROUTE /burrows/bookmarks
// manage bookmarks
val BOOKMARK_ROUTES: Route.() -> Unit = {
    // PUT /burrows/bookmarks
    // create a bookmark
    put {
        val id = call.queryParameter("id")

        createBookmark(call.userID, id)

        call.respond(HttpStatusCode.OK)
    }

    // DELETE /burrows/bookmarks
    // remove a bookmark
    delete {
        val id = call.queryParameter("id")

        deleteBookmark(call.userID, id)

        call.respond(HttpStatusCode.OK)
    }
}
