package app.burrow.account

import app.burrow.account.models.User
import app.burrow.account.models.authorizedUser
import app.burrow.account.models.getUserByID
import app.burrow.account.models.getUserByUsername
import app.burrow.account.models.getUserResponse
import app.burrow.account.models.retrieveUser
import app.burrow.account.models.updateUsername
import app.burrow.account.models.userID
import app.burrow.account.models.validateUsername
import app.burrow.account.profile.Profile
import app.burrow.account.profile.followUser
import app.burrow.account.profile.unFollowUser
import app.burrow.account.profile.updateProfile
import app.burrow.errors.InvalidAuthorization
import app.burrow.queryParameter
import app.burrow.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable

/** All routes relating to [User] */
val USER_ROUTES: Route.() -> Unit = {
    authenticate("primary") {
        // GET /user
        // get the user's information
        get { call.respond(call.authorizedUser()) }

        // GET /user/id/{id}
        // get a user by their ID
        get("/id/{id}") {
            val userID = call.urlParameter("id")
            val user = getUserByID(userID)

            call.respond(getUserResponse(user.id, call.userID))
        }

        // GET /user/username/{username}
        // get a user by their username.
        get("/username/{username}") {
            val username = call.urlParameter("username")
            val user = getUserByUsername(username)

            call.respond(getUserResponse(user.id, call.userID))
        }

        // routes involving the profile
        route("/profile") {
            /** A request to update the username. */
            @Serializable data class UpdateUsernameRequest(val username: String)

            // POST /profile/name
            // specifically update the user
            post("/username") {
                val (username) = call.receive<UpdateUsernameRequest>()

                validateUsername(username)

                updateUsername(call.userID, username)

                call.respond(HttpStatusCode.OK)
            }

            /** A request to update a user's profile. */
            @Serializable
            data class UpdateProfileRequest(
                val name: String,
                val visibility: Profile.Visibility,
                val bio: String? = null,
                val phoneNumber: String? = null,
                val gradYear: Int? = null,
                val classes: List<String>? = null,
                val instagram: String? = null,
            )

            // POST /profile
            // update your profile
            post {
                val (name, visibility, bio, phoneNumber, gradYear, classes, instagram) =
                    call.receive<UpdateProfileRequest>()

                val profile =
                    Profile(
                        call.userID,
                        name,
                        visibility,
                        bio,
                        gradYear,
                        classes,
                        phoneNumber,
                        instagram,
                    )

                profile.validate()
                updateProfile(profile)

                call.respond(HttpStatusCode.OK, profile)
            }

            // routes involving following
            route("/follow") {
                // POST /user/profile/follow
                // follow a user
                post {
                    val userID = call.queryParameter("userID")

                    followUser(call.userID, userID)

                    call.respond(HttpStatusCode.OK)
                }

                // DELETE /user/profile/follow
                // un-follow a user
                delete {
                    val userID = call.queryParameter("userID")

                    unFollowUser(call.userID, userID)

                    call.respond(HttpStatusCode.OK)
                }
            }
        }
    }

    /** Log in with a Google authentication token. */
    put("/login") {
        val body = call.receiveText()
        val user = retrieveUser(body) ?: throw InvalidAuthorization()

        call.respond(user)
    }
}
