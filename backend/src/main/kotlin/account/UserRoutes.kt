package app.burrow.account

import app.burrow.InvalidAuthorization
import app.burrow.account.alt.login
import app.burrow.account.models.User
import app.burrow.account.models.deleteUser
import app.burrow.account.models.getUserByID
import app.burrow.account.models.getUserByUsername
import app.burrow.account.models.getUserResponse
import app.burrow.account.models.exchangeCodeForIdToken
import app.burrow.account.models.retrieveUser
import app.burrow.account.models.searchUsers
import app.burrow.account.models.updateUsername
import app.burrow.account.models.userID
import app.burrow.account.models.validateUsername
import app.burrow.account.profile.Profile
import app.burrow.account.profile.RELATION_ROUTES
import app.burrow.account.profile.updateProfile
import app.burrow.burrows.searchBurrows
import app.burrow.optionalIntQueryParameter
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

        // GET /user/history
        // get your own burrow history
        get("/history") {
            val page = call.optionalIntQueryParameter("page") ?: 1

            val burrowHistory =
                searchBurrows(page) {
                    authorUserID = call.userID
                    dateRange = -1L..-1L
                }

            call.respond(burrowHistory)
        }

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

        // ROUTE /relations
        // manage user relations.
        route("/relations", RELATION_ROUTES)

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
        }
    }

    // DELETE /user
    // delete your account
    delete {
        deleteUser(call.userID)

        call.respond(HttpStatusCode.OK)
    }

    /** Android OAuth code exchange request */
    @Serializable
    data class AndroidAuthRequest(
        val code: String,
        val codeVerifier: String,
        val redirectUri: String
    )

    // PUT /user/login
    // login
    put("/login") {
        val idToken = if (call.queryParameter("platform") == "android") {
            val request = call.receive<AndroidAuthRequest>()
            exchangeCodeForIdToken(request.code, request.codeVerifier, request.redirectUri)
        } else {
            call.receiveText()
        }

        val user = retrieveUser(idToken) ?: throw InvalidAuthorization()

        call.respond(user)
    }

    /**
     * A request to login to an alternative account.
     *
     * @param username The username to the account.
     * @param password The password to the account.
     */
    @Serializable data class AltAccountLoginRequest(val username: String, val password: String)

    // PUT /alt/login
    // login to an alternative account
    put("/altlogin") {
        val (username, password) = call.receive<AltAccountLoginRequest>()
        val authorizedUser = login(username, password) ?: throw InvalidAuthorization()

        call.respond(authorizedUser)
    }
}
