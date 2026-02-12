package app.burrow.features.account

import app.burrow.api.Error
import app.burrow.api.photo.createPhoto
import app.burrow.api.photo.deletePhoto
import app.burrow.api.photo.s3PublicUrl
import app.burrow.api.photo.verifyPhoto
import app.burrow.features.account.models.userID
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.header
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.post
import kotlinx.serialization.Serializable

// ROUTE /user/photo
// manage user profile pictures
val USER_PHOTO_ROUTES: Route.() -> Unit = {
    @Serializable data class UploadResponse(val key: String, val url: String)

    // POST /user/photo
    // upload a user's avatar image
    post {
        val bytes = call.receive<ByteArray>()
        val contentType =
            call.request.header("Content-Type")
                ?: throw Error(400, "Content-Type header is required!")

        verifyPhoto(contentType, bytes)

        val key = "user/${call.userID}/avatar"
        val url = "$s3PublicUrl/avatars/$key"

        createPhoto("avatars", "user/${call.userID}/avatar", bytes)

        call.respond(HttpStatusCode.OK, UploadResponse(key, url))
    }

    // DELETE /user/photo
    // delete a user's avatar
    delete {
        deletePhoto("avatars", "user/${call.userID}/avatar")

        call.respond(HttpStatusCode.OK)
    }
}