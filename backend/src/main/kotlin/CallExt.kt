package app.burrow

import io.ktor.server.application.ApplicationCall
import kotlin.text.toLongOrNull


fun ApplicationCall.queryParameter(name: String): String =
    request.queryParameters[name] ?: throw Error(400, "Missing parameter: $name")

fun ApplicationCall.intQueryParameter(name: String): Int =
    optionalIntQueryParameter(name) ?: throw Error(400, "Missing parameter: $name")

fun ApplicationCall.optionalIntQueryParameter(name: String): Int? =
    request.queryParameters[name]?.toIntOrNull()

inline fun <reified T : Enum<T>> ApplicationCall.enumQueryParameter(name: String): T {
    val value = request.queryParameters[name] ?: throw Error(400, "Missing parameter: $name")

    return try {
        enumValueOf<T>(value)
    } catch (_: IllegalArgumentException) {
        throw Error(400, "Invalid value for parameter $name: $value")
    }
}

fun ApplicationCall.longQueryParameter(name: String): Long =
    optionalLongQueryParameter(name) ?: throw Error(400, "Missing parameter: $name")

fun ApplicationCall.urlParameter(name: String): String =
    parameters[name] ?: throw Error(400, "Missing parameter: $name")

inline fun <reified T : Enum<T>> ApplicationCall.optionalEnumQueryParameter(name: String): T? {
    val value = request.queryParameters[name] ?: return null

    return try {
        enumValueOf<T>(value)
    } catch (_: IllegalArgumentException) {
        null
    }
}

fun ApplicationCall.optionalLongQueryParameter(name: String): Long? =
    request.queryParameters[name]?.toLongOrNull()

fun List<String>.throwIfNotEmpty() {
    if (isNotEmpty()) throw MultiError(400, this)
}

fun <T> T?.throwIfNull(message: String? = null): T {
    if (this == null) throw NotFound(message)

    return this
}
