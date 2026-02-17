package app.burrow.features.account

import app.burrow.api.InvalidAuthorization
import app.burrow.features.account.alt.login
import app.burrow.features.account.models.deleteUser
import app.burrow.features.account.models.exchangeCodeForIdToken
import app.burrow.features.account.models.getUserByID
import app.burrow.features.account.models.getUserByUsername
import app.burrow.features.account.models.getUserResponse
import app.burrow.features.account.models.retrieveUser
import app.burrow.features.account.models.searchUsers
import app.burrow.features.account.models.updateUsername
import app.burrow.features.account.models.userID
import app.burrow.features.account.models.validateUsername
import app.burrow.api.throwIfNotEmpty
import app.burrow.api.verify
import app.burrow.api.verifyField
import app.burrow.features.account.profile.Profile
import app.burrow.features.account.profile.RELATION_ROUTES
import app.burrow.features.account.profile.updateProfile
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.queryParameter
import app.burrow.api.urlParameter
import app.burrow.features.burrows.searchBurrows
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

        // ROUTE /user/block
        // manage blocked users
        route("/block") {
            // GET /user/block
            // get the blocked users with details
            get { call.respond(getBlockedUsersWithDetails(call.userID)) }

            // PUT /user/block
            // add a blocked user
            put {
                val userID = getUserByID(call.queryParameter("userID")).id

                blockUser(call.userID, userID)

                call.respond(HttpStatusCode.OK)
            }

            // DELETE /user/block
            // remove a blocked user
            delete {
                val userID = getUserByID(call.queryParameter("userID")).id

                unBlockUser(call.userID, userID)

                call.respond(HttpStatusCode.OK)
            }
        }

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

            // POST /user/profile/verify
            // verify fields of a profile
            post("/verify") {
                val fields = call.receive<Map<String, Any>>()

                fields
                    .flatMap { (field, value) -> verifyField<Profile>(field, value) }
                    .throwIfNotEmpty()

                call.respond(HttpStatusCode.OK)
            }

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
                        badges = listOf(),
                    )

                profile.normalize()
                profile.verify().throwIfNotEmpty()
                updateProfile(profile)

                call.respond(HttpStatusCode.OK, profile)
            }
        }

        // DELETE /user
        // delete your account
        delete {
            deleteUser(call.userID)

            call.respond(HttpStatusCode.OK)
        }
    }

    /** Android OAuth code exchange request */
    @Serializable
    data class AndroidAuthRequest(
        val code: String,
        val codeVerifier: String,
        val redirectUri: String,
    )

    // PUT /user/login
    // login
    put("/login") {
        val idToken =
            if (call.queryParameters["platform"] == "android") {
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
