package app.burrow.admin.log

import app.burrow.env
import app.burrow.query
import ch.qos.logback.classic.Level
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.AppenderBase
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.r2dbc.insert
import org.slf4j.Marker
import org.slf4j.MarkerFactory

/** Marker to force a log entry to be saved to the database. */
val DB_LOG: Marker = MarkerFactory.getMarker("DB_LOG")

/** Table of [LogEntry] */
object Logs : Table("administrator_logs") {
    /** [LogEntry.id] */
    val id = uuid("id")

    /** [LogEntry.level] */
    val level = varchar("level", 10)

    /** [LogEntry.message] */
    val message = varchar("message", 2000)

    /** [LogEntry.source] */
    val logSource = varchar("source", 100).nullable().default(null)

    /** [LogEntry.userID] */
    val userID = varchar("user_id", 50).nullable().default(null)

    /** [LogEntry.exceptionClass] */
    val exceptionClass = varchar("exception_class", 500).nullable().default(null)

    /** [LogEntry.stackTrace] */
    val stackTrace = varchar("stack_trace", 10000).nullable().default(null)

    /** [LogEntry.metadata] */
    val metadata = varchar("metadata", 5000).nullable().default(null)

    /** [LogEntry.timestamp] */
    val timestamp = long("timestamp")

    override val primaryKey = PrimaryKey(id)
}

/**
 * A log entry.
 *
 * @property id Unique identifier for the log entry.
 * @property level The log level.
 * @property message The message describing what happened.
 * @property source The source/category of the log.
 * @property userID The user ID associated with this log entry (if applicable).
 * @property exceptionClass The exception class name (if this is an error log).
 * @property stackTrace The full stack trace (if this is an error log).
 * @property metadata Additional context/metadata as JSON (if applicable).
 * @property timestamp The timestamp when the log was created.
 */
@Serializable
data class LogEntry(
    val id: String,
    val level: String,
    val message: String,
    val source: String? = null,
    val userID: String? = null,
    val exceptionClass: String? = null,
    val stackTrace: String? = null,
    val metadata: String? = null,
    val timestamp: String,
)

/** If logging to the database is enabled */
private var databaseLoggingEnabled: Boolean = env("DATABASE_LOGGING_ENABLED")?.toBoolean() ?: true

/** Minimum log level to save to database. */
private var minLogLevel: Level =
    env("DATABASE_LOG_MIN_LEVEL")?.let {
        try {
            Level.valueOf(it)
        } catch (_: IllegalArgumentException) {
            Level.ERROR
        }
    } ?: Level.ERROR

/** Log to database depending on [databaseLoggingEnabled] and [minLogLevel]. */
class DatabaseLogAppender : AppenderBase<ILoggingEvent>() {
    override fun append(event: ILoggingEvent) {
        // Check if this log has the DB_LOG marker
        val hasDbLogMarker = event.markerList?.any { it.name == "DB_LOG" } ?: false

        // Skip if database logging is disabled and not marked, or if level is too low and not
        // marked
        if (
            !hasDbLogMarker &&
                (!databaseLoggingEnabled || event.level.levelInt < minLogLevel.levelInt)
        ) {
            return
        }

        // Write to database asynchronously
        CoroutineScope(Dispatchers.IO).launch {
            try {
                query {
                    Logs.insert {
                        it[Logs.id] = UUID.randomUUID()
                        it[Logs.level] = event.level.levelStr
                        it[Logs.message] = event.formattedMessage?.take(2000) ?: ""
                        it[Logs.logSource] = event.loggerName?.take(100)
                        it[Logs.userID] = event.mdcPropertyMap["userID"]?.take(50)
                        it[Logs.exceptionClass] = event.throwableProxy?.className?.take(500)
                        it[Logs.stackTrace] =
                            event.throwableProxy?.let { proxy ->
                                buildString {
                                        append(proxy.className)
                                        append(": ")
                                        append(proxy.message)
                                        append("\n")
                                        proxy.stackTraceElementProxyArray?.take(50)?.forEach { ste
                                            ->
                                            append("\tat ")
                                            append(ste.steAsString)
                                            append("\n")
                                        }
                                    }
                                    .take(10000)
                            }

                        it[Logs.metadata] = event.mdcPropertyMap["metadata"]?.take(5000)
                        it[Logs.timestamp] = event.timeStamp
                    }
                }
            } catch (_: Exception) {
                // If logging to database fails, silently ignore to avoid recursion
            }
        }
    }
}
