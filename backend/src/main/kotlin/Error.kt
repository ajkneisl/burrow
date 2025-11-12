package app.burrow

sealed class ServerError(val code: Int, override val message: String) : Exception()

class Error(code: Int, message: String) : ServerError(code, message)

class MultiError(val code: Int, val messages: List<String>) : Exception()

class InvalidArguments : ServerError(400, "Invalid arguments.")

class NotFound(notFound: String? = null) : ServerError(404, notFound ?: "That could not be found.")

class InvalidAuthorization : ServerError(401, "Invalid authorization.")
