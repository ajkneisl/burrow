package app.burrow.account.chat

import app.burrow.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [ChatMessage] */
object ChatMessages : Table("chat_messages") {
    /** [ChatMessage.id] */
    val id = uuid("id").uniqueIndex()

    /** [ChatMessage.parentID] */
    val parentID = varchar("parent_id", 36)

    /** [ChatMessage.senderID] */
    val senderID = reference("sender_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [ChatMessage.message] */
    val message = varchar("message", 512)

    /** [ChatMessage.createdAt] */
    val createdAt = long("created_at")
}
