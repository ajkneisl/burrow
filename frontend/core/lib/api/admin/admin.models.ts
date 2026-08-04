import type { AccountType } from "../user/user.models"

/**
 * An administrator's account. This is a regular Burrow account with the
 * `ADMIN` account type.
 *
 * @param id The unique ID of the account.
 * @param username The username.
 * @param email The email.
 * @param accountType The account's type.
 * @param createdAt When the account was created.
 */
export type AdminAccount = {
    id: string
    username: string
    email: string
    accountType: AccountType
    createdAt: number
}

/**
 * Site-wide analytics.
 */
export type AnalyticsResponse = {
    userCount: number
    activeUserCount: number
    meetingCount: number
    activeMeetingCount: number
}

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
 * A page of logs.
 */
export type LogsResponse = {
    logs: LogEntry[]
    page: number
    hasMore: boolean
}
