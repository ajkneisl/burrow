package app.burrow.features.account.chat

import java.util.UUID
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import org.jetbrains.exposed.v1.core.ResultRow

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
data class ChatMessage(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val parentID: String,
    val senderID: String,
    val message: String,
    val createdAt: Long,
) {
    companion object {
        /**
         * Convert a [row] to a [ChatMessage].
         *
         * @param row The row containing a [ChatMessage].
         */
        fun fromRow(row: ResultRow): ChatMessage =
            ChatMessage(
                id = row[ChatMessages.id],
                parentID = row[ChatMessages.parentID],
                senderID = row[ChatMessages.senderID],
                message = row[ChatMessages.message],
                createdAt = row[ChatMessages.createdAt],
            )

        /** Serializes a UUID. */
        object UUIDSerializer : KSerializer<UUID> {
            override val descriptor = PrimitiveSerialDescriptor("UUID", PrimitiveKind.STRING)

            override fun deserialize(decoder: Decoder): UUID =
                UUID.fromString(decoder.decodeString())

            override fun serialize(encoder: Encoder, value: UUID) =
                encoder.encodeString(value.toString())
        }
    }
}
