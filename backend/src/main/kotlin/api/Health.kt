package app.burrow.api

import app.burrow.api.photo.minioClient
import app.burrow.getVersion
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.util.date.getTimeMillis
import kotlin.time.Duration.Companion.seconds
import kotlinx.serialization.Serializable

/**
 * Handles the health checks for Burrow.
 *
 * This checks:
 * - S3 health
 * - db health
 */
object Health {
    /** How long a health check is cached for. */
    private val CACHE_TIME = 30.seconds.inWholeMilliseconds

    /** The cached health check. */
    private var healthCheck: Pair<Long, HealthResponse>? = null

    /** The checks to do. */
    private val checks: Map<String, suspend () -> Boolean> =
        mapOf(
            "database" to
                {
                    DB != null &&
                        query {
                            DB?.dialectMetadata?.allTablesNames()?.isNotEmpty() == true
                        }
                },
            "s3" to { minioClient.listBuckets().isNotEmpty() },
        )

    /** Perform [checks]. */
    private suspend fun performHealthCheck(): Map<String, Boolean> {
        return checks.map { (k, f) -> k to (runCatching { f() }.getOrNull() ?: false) }.toMap()
    }

    /** The response given for the heal endpoint. */
    @Serializable
    private data class HealthResponse(
        val version: String,
        val data: Map<String, Boolean>,
    )

    /** GET /api/health */
    val HEALTH_ROUTE: Route.() -> Unit = {
        get {
            var check = healthCheck

            if (check == null || getTimeMillis() - check.first > CACHE_TIME) {
                check = getTimeMillis() to HealthResponse(getVersion(), performHealthCheck())
                healthCheck = check
            }

            call.respond(check.second)
        }
    }
}
