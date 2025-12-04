/**
 * A log entry.
 *
 * @param id Unique identifier for the log entry.
 * @param level The log level.
 * @param message The message describing what happened.
 * @param source The source/category of the log.
 * @param userID The user ID associated with this log entry (if applicable).
 * @param exceptionClass The exception class name (if this is an error log).
 * @param stackTrace The full stack trace (if this is an error log).
 * @param metadata Additional context/metadata as JSON (if applicable).
 * @param timestamp The timestamp when the log was created.
 */
export type LogEntry = {
    id: string
    level: string
    message: string
    source: string | null
    userID: string | null
    exceptionClass: string | null
    stackTrace: string | null
    metadata: string | null
    timestamp: string
}

/**
 * Response from the logs API.
 */
export type LogsResponse = {
    logs: LogEntry[]
    page: number
    hasMore: boolean
}