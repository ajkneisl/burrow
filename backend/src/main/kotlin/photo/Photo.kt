package app.burrow.photo

import app.burrow.Error
import app.burrow.account.models.userID
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.header
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.post
import io.minio.MinioClient
import io.minio.PutObjectArgs
import io.minio.RemoveObjectArgs
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

/**
 * Verify a photo and ensure it's not some crazy shit.
 *
 * @param contentType The type of photo.
 * @param bytes The photo itself.
 * @param maxSize The max size in bytes.
 * @param validContentType The allowed content types.
 * @param maxDimensions The max dimensions of the photo (x and y).
 */
fun verifyPhoto(
    contentType: String,
    bytes: ByteArray,
    maxSize: Long = MAX_IMAGE_SIZE,
    validContentType: Set<String> = VALID_CONTENT_TYPES,
    maxDimensions: Int = MAX_IMAGE_DIMENSIONS,
) {
    // validate
    when {
        bytes.isEmpty() -> {
            throw Error(400, "Image cannot be empty!")
        }

        // validate size
        bytes.size > maxSize -> {
            throw Error(400, "Your avatar must be under ${maxSize / (1024 * 1024)} MB!")
        }

        // validate content type
        contentType !in validContentType -> {
            throw Error(400, "Invalid photo type. Allowed types: PNG, JPEG, GIF, WebP")
        }
    }

    // ensure it's a valid image
    try {
        ByteArrayInputStream(bytes).use { inputStream ->
            val image = ImageIO.read(inputStream) ?: throw Error(400, "File is not a valid image!")

            if (image.width > maxDimensions || image.height > maxDimensions) {
                throw Error(
                    400,
                    "Image dimensions too large! Maximum: ${maxDimensions}x${maxDimensions}px",
                )
            }
        }
    } catch (e: Error) {
        throw e
    } catch (_: Exception) {
        throw Error(400, "Invalid or corrupted image file!")
    }
}

/**
 * Delete a photo.
 *
 * @param bucket The bucket the photo is in.
 * @param key The key of the photo.
 */
fun deletePhoto(bucket: String, key: String) {
    try {
        minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).`object`(key).build())
    } catch (ex: Exception) {
        throw Error(500, "Failed to delete photo: ${ex.message}")
    }
}

/**
 * Create a photo.
 *
 * @param bucket The bucket the photo should be created in.
 * @param key The key of the photo.
 * @param photo The content of the photos.
 */
fun createPhoto(bucket: String, key: String, photo: ByteArray) {
    try {
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(bucket)
                .`object`(key)
                .stream(ByteArrayInputStream(photo), photo.size.toLong(), -1)
                .build()
        )
    } catch (ex: Exception) {
        throw Error(500, "Failed to create photo: ${ex.message}")
    }
}
