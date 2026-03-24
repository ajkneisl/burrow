package app.burrow.features.report

import app.burrow.api.MappedTable
import app.burrow.api.UUIDSerializer
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import app.burrow.api.verify.Verifiable
import app.burrow.api.verify.VerificationScope
import app.burrow.api.verify.Verifier
import kotlinx.serialization.Serializable
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
@MappedTable(Reports::class)
data class Report(
    /** The unique ID of the report. */
    @Serializable(with = UUIDSerializer::class) val id: UUID,

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
)

/** A submitted report. */
@Verifiable(with = SubmittedReportVerifier::class)
@Serializable
data class SubmittedReport(
    val reportType: ReportType,
    val summary: String,
    val category: String,
    val details: String,
    val userAgent: String? = null,
    val path: String? = null,
    val attachedID: String? = null,
)

class SubmittedReportVerifier : Verifier<SubmittedReport>() {
    override suspend fun VerificationScope<SubmittedReport>.rules() {
        SubmittedReport::summary {
            lengthIn(1..255, "Summary must be between 1 and 255 characters.")
        }

        SubmittedReport::details {
            lengthIn(1..5000, "Details must be between 1 and 5000 characters.")
        }

        check(SubmittedReport::category) {
            errorIf("Category is not valid for this report type.") {
                it !in instance.reportType.categories
            }
        }

        check(SubmittedReport::userAgent) {
            errorIf("User agent must be 512 characters or fewer.") {
                (it?.length ?: 0) > 512
            }
        }

        check(SubmittedReport::path) {
            errorIf("Path must be 512 characters or fewer.") {
                (it?.length ?: 0) > 512
            }
        }

        check(SubmittedReport::attachedID) {
            errorIf("Attached ID must be 64 characters or fewer.") {
                (it?.length ?: 0) > 64
            }
        }
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
    Reports.selectAll().map { row -> row.toEntity<Report>(Reports) }.toList()
}
