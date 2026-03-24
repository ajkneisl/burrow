package app.burrow.features.report

import app.burrow.features.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Report] */
object Reports : Table("reports") {
    /** [Report.id] */
    val id = uuid("id").autoGenerate()

    /** [Report.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [Report.reportType] */
    val reportType = varchar("report_type", 32)

    /** [Report.summary] */
    val summary = varchar("summary", 255)

    /** [Report.details] */
    val details = text("details")

    /** [Report.category] */
    val category = varchar("category", 64)

    /** [Report.path] */
    val path = varchar("path", 512).nullable()

    /** [Report.userAgent] */
    val userAgent = varchar("user_agent", 512).nullable()

    /** [Report.attachedID] */
    val attachedID = varchar("attached_id", 64).nullable()

    /** [Report.createdAt] */
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
