package app.burrow.burrows.sync.chat

import app.burrow.account.Users
import app.burrow.burrows.models.Burrows
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** Stored chat messages */
object ChatMessages : Table("chat_messages") {
    /** [ChatMessage.messageID] */
    val messageID = uuid("message_id").uniqueIndex()

    /** [ChatMessage.burrowID] */
    val burrowID = reference("meeting_id", Burrows.id, onDelete = ReferenceOption.CASCADE)

    /** [ChatMessage.userID] */
    val userID = reference("user_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [ChatMessage.date] */
    val date = long("date")

    /** [ChatMessage.message] */
    val message = varchar("message", length = 256)
}
