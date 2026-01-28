package app.burrow.report

import app.burrow.account.chat.ChatMessage
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

enum class ReportType(val categories: Set<String>) {
    GENERAL(setOf("Bug", "Content", "Performance", "Accessibility", "Other")),
    BURROW(setOf("Inappropriate Content", "Misleading Information", "Spam", "Other")),
    USER(setOf("Spam", "Harassment", "Inappropriate Content", "Impersonation", "Other")),
    CHAT(setOf("Harassment", "Spam", "Inappropriate Content", "Other")),
}

/** A single report. */
@Serializable
data class Report(
    /** The unique ID of the report. */
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val id: UUID,

    /** The ID of the user reporting. */
    val userID: String,

    /** The type of report. */
    val reportType: ReportType,

    /** The summary of the report. */
    val summary: String,

    /** Details of the report. */
    val details: String,

    /** The category of the report. */
    val category: String,

    /** Where the report originated from. */
    val path: String?,

    /** The user agent. */
    val userAgent: String?,

    /** The ID of the attached item, like a Burrow or user ID. */
    val attachedID: String?,

    /** When the user creates the report. */
    val createdAt: Long,
) {
    companion object {
        fun fromRow(row: ResultRow): Report =
            Report(
                id = row[Reports.id],
                userID = row[Reports.userID],
                reportType = ReportType.valueOf(row[Reports.reportType]),
                summary = row[Reports.summary],
                details = row[Reports.details],
                category = row[Reports.category],
                path = row[Reports.path],
                userAgent = row[Reports.userAgent],
                attachedID = row[Reports.attachedID],
                createdAt = row[Reports.createdAt],
            )
    }
}

/** A submitted report. */
@Serializable
data class SubmittedReport(
    val reportType: ReportType,
    val summary: String,
    val category: String,
    val details: String,
    val userAgent: String? = null,
    val path: String? = null,
    val attachedID: String? = null,
) {
    /** Validate a submitted report. */
    fun validate(): Boolean {
        return summary.length in 1..255 &&
            details.length in 1..5000 &&
            category in reportType.categories &&
            (userAgent?.length ?: 0) <= 512 &&
            (path?.length ?: 0) <= 512 &&
            (attachedID?.length ?: 0) <= 64
    }
}

/**
 * Create a [Report].
 *
 * @param userId The author of the report.
 * @param report The details of the report
 */
suspend fun createReport(userId: String, report: SubmittedReport): UUID = query {
    Reports.insert {
        it[Reports.userID] = userId
        it[Reports.reportType] = report.reportType.name
        it[Reports.summary] = report.summary
        it[Reports.details] = report.details
        it[Reports.category] = report.category
        it[Reports.path] = report.path
        it[Reports.userAgent] = report.userAgent
        it[Reports.attachedID] = report.attachedID
        it[Reports.createdAt] = getTimeMillis()
    } get Reports.id
}

/**
 * Get all reports.
 *
 * @return A list of all [Report]s.
 */
suspend fun getAllReports(): List<Report> = query {
    Reports.selectAll().map(Report::fromRow).toList()
}
