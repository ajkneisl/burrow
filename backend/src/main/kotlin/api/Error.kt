package app.burrow.api

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
