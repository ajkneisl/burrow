package app.burrow.features.account.profile

import app.burrow.api.Error
import app.burrow.api.InvalidArguments
import app.burrow.features.account.models.getUserByID
import app.burrow.api.photo.createPhoto
import app.burrow.api.photo.deletePhoto
import app.burrow.api.photo.verifyPhoto
import app.burrow.api.query
import app.burrow.api.urlParameter
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.header
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.select
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** Database table for badges. */
object Badges : Table("badges") {
    /** Unique badge identifier. */
    val id = varchar("id", 32)

    /** Badge description. */
    val description = varchar("description", 255)
}

/** A badge. */
@Serializable data class Badge(val id: String, val description: String)

/** Get all badges. */
suspend fun getAllBadges(): List<Badge> = query {
    Badges.selectAll().map { Badge(it[Badges.id], it[Badges.description]) }.toList()
}

/** Get [userID]'s badges. */
suspend fun getUserBadges(userID: String): List<String>? = query {
    Profiles.select(Profiles.userID, Profiles.badges)
        .where { Profiles.userID eq userID }
        .singleOrNull()
        ?.get(Profiles.badges)
}

/**
 * Create a badge.
 *
 * @param id The unique ID of the badge.
 * @param description The description of the badge.
 * @param image The badge's image.
 */
suspend fun createBadge(id: String, description: String, image: ByteArray) {
    query {
        Badges.insert {
            it[this.id] = id
            it[this.description] = description
        }
    }

    createPhoto("badges", id, image)
}

/**
 * Delete a badge.
 *
 * @param id The ID of the created badge.
 */
suspend fun deleteBadge(id: String) {
    query { Badges.deleteWhere { Badges.id eq id } }

    deletePhoto("badges", id)
}

/**
 * Update a user's badges.
 *
 * @param userID The user's ID.
 * @param badges The badges to set.
 */
suspend fun updateUserBadges(userID: String, badges: List<String>) = query {
    val allBadges = getAllBadges().map { it.id.lowercase() }

    // ensure that all badges are real
    if (badges.any { badge -> badge.lowercase() !in allBadges }) {
        throw InvalidArguments()
    }

    Profiles.update({ Profiles.userID eq userID }) { it[Profiles.badges] = badges }
}

/**
 * Give a user a badge.
 *
 * @param userID The user to give the [badge] to.
 * @param badge The badge to give to [userID].
 */
suspend fun giveBadge(userID: String, badge: String) = query {
    val allBadges = getAllBadges().map { it.id.lowercase() }

    if (badge.lowercase() !in allBadges) {
        throw InvalidArguments()
    }

    val current = getUserBadges(userID) ?: throw Error(404, "User not found.")

    if (badge in current) return@query

    Profiles.update({ Profiles.userID eq userID }) { it[Profiles.badges] = current + badge }
}

// ROUTE /admin/badges
// manage badges
val BADGE_ROUTES: Route.() -> Unit = {
    // GET /admin/badges
    // get all badges
    get { call.respond(getAllBadges()) }

    // ROUTE /admin/badges/{id}
    // manage individual badges
    route("/{id}") {
        // DELETE /admin/badges/{id}
        // delete a badge
        delete {
            val id = call.urlParameter("id")

            deleteBadge(id)

            call.respond(HttpStatusCode.OK)
        }

        // PUT /admin/badges/{id}
        // create a badge
        put {
            val id = call.urlParameter("id")

            val description =
                call.request.header("X-Badge-Description")
                    ?: throw Error(400, "X-Badge-Description header is required.")

            val contentType =
                call.request.header("Content-Type")
                    ?: throw Error(400, "Content-Type header is required.")

            val bytes = call.receive<ByteArray>()

            verifyPhoto(contentType, bytes)
            createBadge(id, description, bytes)

            call.respond(HttpStatusCode.Created)
        }
    }

    /** Request to update a user's badges. */
    @Serializable data class UpdateUserBadgesRequest(val badges: List<String>)

    // ROUTE /admin/badges/user/{id}
    // manage a user's badges
    route("/user/{id}") {
        // POST /admin/badges/user/{id}
        // update a user's badges
        post {
            val userID = call.urlParameter("id")
            val request = call.receive<UpdateUserBadgesRequest>()

            updateUserBadges(userID, request.badges)

            call.respond(HttpStatusCode.OK)
        }

        // GET /admin/badges/user/{id}
        // get a user's badges
        get {
            val userID = call.urlParameter("id")

            // ensure user exists
            getUserByID(userID)

            call.respond(HttpStatusCode.OK, getUserBadges(userID) ?: listOf())
        }
    }
}
