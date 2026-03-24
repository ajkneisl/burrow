package app.burrow.api

import app.burrow.LOGGER
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.Serializable
import org.slf4j.MDC

sealed class ServerError(val code: Int, override val message: String) : Exception()

class Error(code: Int, message: String) : ServerError(code, message)

class MultiError(val code: Int, val messages: List<String>) : Exception()

class InvalidArguments : ServerError(400, Errors.INVALID_AUTHORIZATION)

class NotFound(notFound: String? = null) : ServerError(404, notFound ?: Errors.NOT_FOUND)

class InvalidAuthorization : ServerError(401, Errors.INVALID_ARGUMENTS)

object Errors {
    const val INVALID_ARGUMENTS = "Invalid arguments."
    const val INVALID_AUTHORIZATION = "Invalid authorization."
    const val NOT_FOUND = "That could not be found."
}

fun Application.configureErrors() {
    // status page
    // handles errors
    install(StatusPages) {
        exception<CancellationException> { _, _ -> }

        @Serializable data class ErrorResponse<T>(val error: String?, val message: T?)

        exception<BadRequestException> { call, _ ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse("MalformedBody", "Invalid request body."),
            )
        }

        // this is the default error
        // contains invalid args, etc
        exception<ServerError> { call, cause ->
            call.respond(
                HttpStatusCode.fromValue(cause.code),
                ErrorResponse(cause::class.simpleName, cause.message),
            )
        }

        // multiple errors
        exception<MultiError> { call, cause ->
            call.respond(
                HttpStatusCode.fromValue(cause.code),
                ErrorResponse(cause::class.simpleName, cause.messages),
            )
        }

        // generic error
        exception<Throwable> { call, cause ->
            call.principal<JWTPrincipal>()?.subject?.let { MDC.put("userID", it) }
            LOGGER.error("Unhandled exception: ${cause.message ?: "Unknown error"}", cause)
            MDC.clear()

            cause.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
        }
    }
}