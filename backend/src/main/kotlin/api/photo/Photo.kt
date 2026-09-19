package app.burrow.api.photo

import app.burrow.api.Error
import app.burrow.env
import java.io.ByteArrayInputStream
import java.net.URI
import javax.imageio.ImageIO
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest

// s3 information
val s3Bucket = env("S3_BUCKET") ?: "burrow"
val s3PublicUrl = env("S3_PUBLIC_URL") ?: "http://localhost:9000/$s3Bucket"

/**
 * The S3 client. On AWS this uses the default credential chain (the ECS task role).
 *
 * For local development against MinIO, set `S3_ENDPOINT`, `S3_ACCESS_KEY` and `S3_SECRET_KEY`.
 */
val s3Client: S3Client =
    S3Client.builder()
        .region(Region.of(env("AWS_REGION") ?: "us-east-1"))
        .apply {
            env("S3_ENDPOINT")?.let { endpoint ->
                endpointOverride(URI.create(endpoint))
                forcePathStyle(true)
            }

            val accessKey = env("S3_ACCESS_KEY")
            val secretKey = env("S3_SECRET_KEY")

            if (accessKey != null && secretKey != null) {
                credentialsProvider(
                    StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
                )
            }
        }
        .build()

private const val CACHE_CONTROL = "public, max-age=300"

private val VALID_CONTENT_TYPES = setOf("image/png", "image/jpeg", "image/gif", "image/webp")
private const val MAX_IMAGE_SIZE = 16L * 1024 * 1024 // 16 MB
private const val MAX_IMAGE_DIMENSIONS = 8192

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
 * @param folder The top-level folder in [s3Bucket] the photo is in.
 * @param key The key of the photo.
 */
fun deletePhoto(folder: String, key: String) {
    try {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(s3Bucket).key("$folder/$key").build())
    } catch (ex: Exception) {
        throw Error(500, "Failed to delete photo: ${ex.message}")
    }
}

/**
 * Create a photo.
 *
 * @param folder The top-level folder in [s3Bucket] the photo should be created in.
 * @param key The key of the photo.
 * @param photo The content of the photos.
 */
fun createPhoto(folder: String, key: String, photo: ByteArray) {
    try {
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key("$folder/$key")
                .cacheControl(CACHE_CONTROL)
                .build(),
            RequestBody.fromBytes(photo),
        )
    } catch (ex: Exception) {
        throw Error(500, "Failed to create photo: ${ex.message}")
    }
}
