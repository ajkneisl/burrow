package app.burrow.admin.log

import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.query
import app.burrow.api.uuidQueryParameter
import app.burrow.features.account.Authorization.ADMIN_AUTH
import io.ktor.server.auth.authenticate
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import java.time.Instant
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.selectAll

@Serializable data class LogsResponse(val logs: List<LogEntry>, val page: Int, val hasMore: Boolean)

val LOG_ROUTES: Route.() -> Unit = {
    authenticate(ADMIN_AUTH) {
        // GET /admin/logs
        // Retrieve paginated logs
        get {
            val page = call.optionalIntQueryParameter("page") ?: 1
            val pageSize = 50
            val offset = (page - 1) * pageSize

            // Optional filters
            val levelFilter = call.queryParameters["level"]?.uppercase()
            val sourceFilter = call.queryParameters["source"]
            val userIDFilter = call.queryParameters["userID"]

            val logs = query {
                Logs.selectAll()
                    .orderBy(Logs.timestamp, SortOrder.DESC)
                    .limit(pageSize)
                    .map { row ->
                        LogEntry(
                            id = row[Logs.id].toString(),
                            level = row[Logs.level],
                            message = row[Logs.message],
                            source = row[Logs.logSource],
                            userID = row[Logs.userID],
                            exceptionClass = row[Logs.exceptionClass],
                            stackTrace = row[Logs.stackTrace],
                            metadata = row[Logs.metadata],
                            timestamp = Instant.ofEpochMilli(row[Logs.timestamp]).toString(),
                        )
                    }
                    .toList()
                    .let { allLogs ->
                        // Apply filters in memory (simple approach)
                        var filtered = allLogs
                        if (levelFilter != null) {
                            filtered = filtered.filter { it.level == levelFilter }
                        }
                        if (sourceFilter != null) {
                            filtered = filtered.filter { it.source == sourceFilter }
                        }
                        if (userIDFilter != null) {
                            filtered = filtered.filter { it.userID == userIDFilter }
                        }

                        // Apply pagination
                        filtered.drop(offset).take(pageSize)
                    }
            }

            call.respond(LogsResponse(logs = logs, page = page, hasMore = logs.size == pageSize))
        }

        // GET /admin/logs/{id}
        // Retrieve a specific log entry by ID
        get("/{id}") {
            val logId = call.uuidQueryParameter("id")

            val log =
                query {
                    Logs.selectAll()
                        .where { Logs.id eq logId }
                        .map { row ->
                            LogEntry(
                                id = row[Logs.id].toString(),
                                level = row[Logs.level],
                                message = row[Logs.message],
                                source = row[Logs.logSource],
                                userID = row[Logs.userID],
                                exceptionClass = row[Logs.exceptionClass],
                                stackTrace = row[Logs.stackTrace],
                                metadata = row[Logs.metadata],
                                timestamp = Instant.ofEpochMilli(row[Logs.timestamp]).toString(),
                            )
                        }
                        .toList()
                        .firstOrNull()
                } ?: return@get call.respond(io.ktor.http.HttpStatusCode.NotFound)

            call.respond(log)
        }
    }
}
