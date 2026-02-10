package app.burrow.features.chat.direct

import app.burrow.features.account.Users
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/** [Conversation] */
object Conversations : Table("conversations") {
    /** [Conversation.id] */
    val id = varchar("id", 36).uniqueIndex()

    /** [Conversation.userOneID] */
    val userOneID = reference("user_one_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [Conversation.userTwoID] */
    val userTwoID = reference("user_two_id", Users.id, onDelete = ReferenceOption.CASCADE)

    /** [Conversation.createdAt] */
    val createdAt = long("created_at")

    /** [Conversation.lastMessageAt] */
    val lastMessageAt = long("last_message_at")

    override val primaryKey = PrimaryKey(id)
}
