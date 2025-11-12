package app.burrow.burrows.sync.chat

import app.burrow.account.Users
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/**
 * Stored chat messages
 */
object ChatMessages : Table("chat_messages") {
    val messageId = uuid("message_id").uniqueIndex()
    val meetingId = reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)
    val date = long("date")
    val message = varchar("message", length = 256)
}