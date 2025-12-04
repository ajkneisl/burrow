package app.burrow.account.profile

import app.burrow.InvalidAuthorization
import app.burrow.account.models.userID
import app.burrow.queryParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

// ROUTE /user/relations
// manage relations, like following, unfollowing, and discovering new users.
val RELATION_ROUTES: Route.() -> Unit = {
    // GET /user/relations/friends
    // retrieve all your friends.
    get("/friends") { call.respond(getFriends(call.userID)) }

    // GET /user/relations/following
    // retrieve all the user's you're following
    get("/following") {
        val userID = call.queryParameters["userID"]

        if (userID != null && !(call.userID isFriendsWith userID)) throw InvalidAuthorization()

        call.respond(getFollowingRelations(userID ?: call.userID))
    }

    // GET /user/relations/followers
    // retrieve all the user's that follow you
    get("/followers") {
        val userID = call.queryParameters["userID"]

        if (userID != null && !(call.userID isFriendsWith userID)) throw InvalidAuthorization()

        call.respond(getFollowingRelations(userID ?: call.userID))
    }

    // GET /user/relations/discover
    // discover users
    get("/discover") { call.respond(discoverUsers(call.userID)) }

    // ROUTE /user/relations/follow
    // manage following
    route("/follow") {
        // POST /user/relations/follow
        // follow a user
        post {
            val userID = call.queryParameter("userID")

            followUser(call.userID, userID)

            call.respond(HttpStatusCode.OK)
        }

        // DELETE /user/relations/follow
        // un-follow a user
        delete {
            val userID = call.queryParameter("userID")

            unFollowUser(call.userID, userID)

            call.respond(HttpStatusCode.OK)
        }
    }
}
