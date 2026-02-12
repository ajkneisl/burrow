package app.burrow.features.clubs

import app.burrow.api.urlParameter
import app.burrow.features.account.models.userID
import app.burrow.features.clubs.members.getClubByName
import app.burrow.features.clubs.members.requireClubAdmin
import app.burrow.api.photo.createPhoto
import app.burrow.api.photo.deletePhoto
import app.burrow.api.photo.s3PublicUrl
import app.burrow.api.photo.verifyPhoto
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.header
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable

// ROUTE /clubs/{name}/photo & /clubs/{name}/banner
// manage club profile pictures and banners
val CLUB_PHOTO_ROUTES: Route.() -> Unit = {
    @Serializable data class UploadResponse(val key: String, val url: String)

    route("/photo") {
        // POST /clubs/{name}/photo
        // upload a club avatar
        post {
            val name = call.urlParameter("name")
            val club = getClubByName(name) ?: throw app.burrow.api.Error(404, "Club not found!")

            if (club.ownerID != call.userID) {
                call.requireClubAdmin(club.id)
            }

            val bytes = call.receive<ByteArray>()
            val contentType =
                call.request.header("Content-Type")
                    ?: throw app.burrow.api.Error(400, "Content-Type header is required!")

            verifyPhoto(contentType, bytes)

            val key = "club/${club.id}/avatar"
            createPhoto("avatars", key, bytes)

            call.respond(HttpStatusCode.OK, UploadResponse(key, "$s3PublicUrl/avatars/$key"))
        }

        // DELETE /clubs/{name}/photo
        // delete a club avatar
        delete {
            val name = call.urlParameter("name")
            val club = getClubByName(name) ?: throw app.burrow.api.Error(404, "Club not found!")

            if (club.ownerID != call.userID) {
                call.requireClubAdmin(club.id)
            }

            deletePhoto("avatars", "club/${club.id}/avatar")

            call.respond(HttpStatusCode.OK)
        }
    }

    route("/banner") {
        // POST /clubs/{name}/banner
        // upload a club banner
        post {
            val name = call.urlParameter("name")
            val club = getClubByName(name) ?: throw app.burrow.api.Error(404, "Club not found!")

            if (club.ownerID != call.userID) {
                call.requireClubAdmin(club.id)
            }

            val bytes = call.receive<ByteArray>()
            val contentType =
                call.request.header("Content-Type")
                    ?: throw app.burrow.api.Error(400, "Content-Type header is required!")

            verifyPhoto(contentType, bytes, maxSize = 5 * 1024 * 1024, maxDimensions = 1920)

            val key = "club/${club.id}/banner"
        createPhoto("avatars", key, bytes)

            call.respond(HttpStatusCode.OK, UploadResponse(key, "$s3PublicUrl/avatars/$key"))
        }

        // DELETE /clubs/{name}/banner
        // delete a club banner
        delete {
            val name = call.urlParameter("name")
            val club = getClubByName(name) ?: throw app.burrow.api.Error(404, "Club not found!")

            if (club.ownerID != call.userID) {
                call.requireClubAdmin(club.id)
            }

            deletePhoto("avatars", "club/${club.id}/banner")

            call.respond(HttpStatusCode.OK)
        }
    }
}
