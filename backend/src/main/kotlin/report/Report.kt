package app.burrow.report

import app.burrow.groups.sync.chat.ChatMessage
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** A single report. */
@Serializable
data class Report(
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val id: UUID,
    val userId: String,
    val summary: String,
    val details: String,
    val category: String,
    val path: String,
    val userAgent: String,
    val burrowInfo: String,
    val createdAt: Long,
) {
    companion object {
        fun fromRow(row: ResultRow): Report =
            Report(
                id = row[Reports.id],
                userId = row[Reports.userId],
                summary = row[Reports.summary],
                details = row[Reports.details],
                category = row[Reports.category],
                path = row[Reports.path],
                userAgent = row[Reports.userAgent],
                burrowInfo = row[Reports.burrowInfo],
                createdAt = row[Reports.createdAt],
            )
    }
}

/** A submitted report. */
@Serializable
data class SubmittedReport(
    val summary: String,
    val category: String,
    val details: String,
    val userAgent: String,
    val path: String,
    val burrowInfo: String,
) {
    /** Validate a submitted report. */
    fun validate(): Boolean {
        val allowedCategories = setOf("Bug", "Content", "Performance", "Accessibility", "Other")

        return summary.length in 6..255 &&
            details.length in 10..5000 &&
            category in allowedCategories &&
            userAgent.isNotBlank() &&
            userAgent.length <= 512 &&
            path.isNotBlank() &&
            path.length <= 512 &&
            burrowInfo.isNotBlank() &&
            burrowInfo.length <= 64
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
        it[Reports.summary] = report.summary
        it[Reports.category] = report.category
        it[Reports.userId] = userId
        it[Reports.details] = report.details
        it[Reports.userAgent] = report.userAgent
        it[Reports.path] = report.path
        it[Reports.burrowInfo] = report.burrowInfo
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
