package app.burrow.errors

open class ServerError(val code: Int, message: String) : Exception(message)

class InvalidArguments : ServerError(400, "Invalid arguments.")

class NotFound : ServerError(404, "Not found.")

class InvalidAuthorization : ServerError(401, "Invalid authorization.")
