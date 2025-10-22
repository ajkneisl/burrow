package app.burrow.report

import app.burrow.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

object Reports : Table("reports") {
    val id = uuid("id").autoGenerate()
    val userId = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    val summary = varchar("summary", 255)
    val details = text("details")
    val category = varchar("category", 64)

    val path = varchar("path", 512)
    val userAgent = varchar("user_agent", 512)
    val burrowInfo = varchar("burrow_info", 64)

    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
