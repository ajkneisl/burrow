package app.burrow.features.chat

import app.burrow.MappedTable
import app.burrow.api.UUIDSerializer
import java.util.UUID
import kotlinx.serialization.Serializable

/**
 * A chat message.
 *
 * @param id The unique message ID.
 * @param parentID The parent entity this message belongs to. This can be a topic, a conversation,
 *   or a Burrow.
 * @param senderID The user who sent this message.
 * @param message The message content.
 * @param createdAt When the message was sent.
 */
@Serializable
@MappedTable(ChatMessages::class)
data class ChatMessage(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val parentID: String,
    val senderID: String,
    val message: String,
    val createdAt: Long,
)
