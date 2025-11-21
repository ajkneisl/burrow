package app.burrow.account

import app.burrow.InvalidAuthorization
import app.burrow.account.models.User
import app.burrow.account.models.getUserByID
import app.burrow.account.models.getUserByUsername
import app.burrow.account.models.getUserResponse
import app.burrow.account.models.retrieveUser
import app.burrow.account.models.searchUsers
import app.burrow.account.models.updateUsername
import app.burrow.account.models.userID
import app.burrow.account.models.validateUsername
import app.burrow.account.profile.Profile
import app.burrow.account.profile.followUser
import app.burrow.account.profile.getFollowersRelations
import app.burrow.account.profile.getFollowingRelations
import app.burrow.account.profile.getFriends
import app.burrow.account.profile.unFollowUser
import app.burrow.account.profile.updateProfile
import app.burrow.photo.USER_PHOTO_ROUTES
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
        // ROUTE /user/photo
        // manage user photos
        route("/photo", USER_PHOTO_ROUTES)

        // GET /user
        // get the user's information
        get { call.respond(getUserResponse(call.userID, call.userID)) }

        // GET /user/search
        // search through users by username or profile name
        get("/search") {
            val query = call.queryParameter("query")
            val excludeMe = call.queryParameter("exclude_me").toBoolean()

            val results =
                searchUsers(
                    searchQuery = query,
                    requestingUserID = if (excludeMe) call.userID else null,
                )

            call.respond(results)
        }

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

        // routes involving followers / following
        route("/relations") {
            // GET /user/relations/friends
            // retrieve all your friends.
            get("/friends") { call.respond(getFriends(call.userID)) }

            // GET /user/relations/following
            // retrieve all the user's you're following
            get("/following") { call.respond(getFollowingRelations(call.userID)) }

            // GET /user/relations/followers
            // retrieve all the user's that follow you
            get("/followers") { call.respond(getFollowersRelations(call.userID)) }
        }

        /** A request to update the account details. */
        @Serializable data class UpdateAccountRequest(val username: String)

        // POST /user
        // update user details
        post {
            var (username) = call.receive<UpdateAccountRequest>()
            username = username.lowercase()

            validateUsername(username)

            updateUsername(call.userID, username)

            call.respond(HttpStatusCode.OK)
        }

        // ROUTE /user/profile
        // manage profile
        route("/profile") {
            /** A request to update a user's profile. */
            @Serializable
            data class UpdateProfileRequest(
                val name: String,
                val visibility: Profile.Visibility,
                val bio: String? = null,
                val phoneNumber: String? = null,
                val gradYear: Int? = null,
                val classes: List<String>? = null,
                val school: String? = null,
                val major: String? = null,
                val instagram: String? = null,
                val linkedIn: String? = null,
            )

            // POST /user/profile
            // update your profile
            post {
                val (
                    name,
                    visibility,
                    bio,
                    phoneNumber,
                    gradYear,
                    classes,
                    school,
                    major,
                    instagram,
                    linkedIn) =
                    call.receive<UpdateProfileRequest>()

                val profile =
                    Profile(
                        userID = call.userID,
                        name = name,
                        visibility = visibility,
                        bio = bio,
                        gradYear = gradYear,
                        classes = classes,
                        school = school,
                        major = major,
                        phoneNumber = phoneNumber,
                        instagram = instagram,
                        linkedIn = linkedIn,
                    )

                profile.validate()
                updateProfile(profile)

                call.respond(HttpStatusCode.OK, profile)
            }

            // ROUTE /user/profile/follow
            route("/follow") {
                // manage following
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

    // PUT /user/login
    // login
    put("/login") {
        val body = call.receiveText()
        val user = retrieveUser(body) ?: throw InvalidAuthorization()

        call.respond(user)
    }
}
