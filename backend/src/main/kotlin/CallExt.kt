package app.burrow

import io.ktor.server.application.ApplicationCall
import java.util.UUID
import kotlin.text.toLongOrNull

/** Get a query parameter by [name]. */
fun ApplicationCall.queryParameter(name: String): String =
    request.queryParameters[name] ?: throw Error(400, "Missing parameter: $name")

/** Get a UUID query parameter by [name]. */
fun ApplicationCall.uuidQueryParameter(name: String): UUID =
    queryParameter(name).runCatching { UUID.fromString(this) }.getOrNull()
        ?: throw Error(400, "Invalid UUID")

/** Get an [Int] query parameter by [name], throw [Error] if it doesn't exist or isn't an Int. */
fun ApplicationCall.intQueryParameter(name: String): Int =
    optionalIntQueryParameter(name) ?: throw Error(400, "Missing parameter: $name")

/** Get a query parameter by [name] and cast to [Int]. */
fun ApplicationCall.optionalIntQueryParameter(name: String): Int? =
    request.queryParameters[name]?.toIntOrNull()

/** Convert a query parameter by a [name] to a [T] enum. */
inline fun <reified T : Enum<T>> ApplicationCall.enumQueryParameter(name: String): T {
    val value = request.queryParameters[name] ?: throw Error(400, "Missing parameter: $name")

    return try {
        enumValueOf<T>(value)
    } catch (_: IllegalArgumentException) {
        throw Error(400, "Invalid value for parameter $name: $value")
    }
}

/** Get a [Long] query parameter. If it's not a long, throw an [Error]. */
fun ApplicationCall.longQueryParameter(name: String): Long =
    optionalLongQueryParameter(name) ?: throw Error(400, "Missing parameter: $name")

/** Get a parameter from the URL by [name]. */
fun ApplicationCall.urlParameter(name: String): String =
    parameters[name] ?: throw Error(400, "Missing parameter: $name")

/** Retrieve [name] from the [ApplicationCall.request] query parameters and cast to [T]. */
inline fun <reified T : Enum<T>> ApplicationCall.optionalEnumQueryParameter(name: String): T? {
    val value = request.queryParameters[name] ?: return null

    return try {
        enumValueOf<T>(value)
    } catch (_: IllegalArgumentException) {
        null
    }
}

/** Retrieve [name] from the [ApplicationCall.request] query parameters and cast to a Long. */
fun ApplicationCall.optionalLongQueryParameter(name: String): Long? =
    request.queryParameters[name]?.toLongOrNull()

/** If [this] isn't empty, throw a [MultiError] with the contents. */
fun List<String>.throwIfNotEmpty() {
    if (isNotEmpty()) throw MultiError(400, this)
}

/** If [this] is null, throw a [NotFound] with a provAs lided [message]. */
fun <T> T?.throwIfNull(message: String? = null): T = this ?: throw NotFound(message)
