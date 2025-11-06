package app.burrow.photo

import app.burrow.account.models.userID
import app.burrow.errors.ServerError
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.header
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.minio.MinioClient
import io.minio.PutObjectArgs
import java.io.ByteArrayInputStream
import javax.imageio.ImageIO
import kotlinx.serialization.Serializable

// s3 information
private val s3AccessKey = System.getenv("S3_ACCESS_KEY") ?: "minio"
private val s3SecretKey = System.getenv("S3_SECRET_KEY") ?: "password"
private val s3Endpoint = System.getenv("S3_ENDPOINT") ?: "http://localhost:9000"
private val s3PublicUrl = System.getenv("S3_PUBLIC_URL") ?: s3Endpoint

val minioClient: MinioClient =
    MinioClient.builder().endpoint(s3Endpoint).credentials(s3AccessKey, s3SecretKey).build()

private val VALID_CONTENT_TYPES = setOf("image/png", "image/jpeg", "image/gif", "image/webp")
private const val MAX_IMAGE_SIZE = 3L * 1024 * 1024 // 3 MB
private const val MAX_IMAGE_DIMENSIONS = 4096

val USER_PHOTO_ROUTES: Route.() -> Unit = {
    @Serializable data class UploadResponse(val key: String, val url: String)

    // POST /user/photo
    // upload a user's avatar image
    post {
        val bytes = call.receive<ByteArray>()

        // find the content type
        val contentType =
            call.request.header("Content-Type")
                ?: throw ServerError(400, "Content-Type header is required!")

        // validate
        when {
            bytes.isEmpty() -> {
                throw ServerError(400, "Image cannot be empty!")
            }

            // validate size
            bytes.size > MAX_IMAGE_SIZE -> {
                throw ServerError(400, "Your avatar must be under 3 MB!")
            }

            // validate content type
            contentType !in VALID_CONTENT_TYPES -> {
                throw ServerError(400, "Invalid photo type. Allowed types: PNG, JPEG, GIF, WebP")
            }
        }

        // ensure it's a valid image
        try {
            ByteArrayInputStream(bytes).use { inputStream ->
                val image = ImageIO.read(inputStream)
                    ?: throw ServerError(400, "File is not a valid image!")

                if (image.width > MAX_IMAGE_DIMENSIONS || image.height > MAX_IMAGE_DIMENSIONS) {
                    throw ServerError(
                        400,
                        "Image dimensions too large! Maximum: ${MAX_IMAGE_DIMENSIONS}x${MAX_IMAGE_DIMENSIONS}px"
                    )
                }
            }
        } catch (e: ServerError) {
            throw e
        } catch (_: Exception) {
            throw ServerError(400, "Invalid or corrupted image file!")
        }

        val key = "user/${call.userID}/avatar"

        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket("avatars")
                    .`object`(key)
                    .stream(ByteArrayInputStream(bytes), bytes.size.toLong(), -1)
                    .contentType(contentType)
                    .build()
            )
        } catch (_: Exception) {
            throw ServerError(500, "Failed to upload image.")
        }

        // find the URL
        val url = "$s3PublicUrl/avatars/$key"

        call.respond(HttpStatusCode.OK, UploadResponse(key, url))
    }
}
