package app.burrow.burrows.sync.chat

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
 * @param messageID The unique ID of the message.
 * @param burrowID The ID of the Burrow where the message was sent.
 * @param userID The ID of the user who created the message.
 * @param message The contents of the message.
 * @param date When the message was created.
 */
@Serializable
data class ChatMessage(
    @Serializable(with = UUIDSerializer::class) val messageID: UUID,
    val burrowID: String,
    val userID: String,
    val message: String,
    val date: Long,
) {
    companion object {
        /**
         * Convert a [row] containing a [ChatMessage].
         *
         * @param row The row containing a [ChatMessage].
         */
        fun fromRow(row: ResultRow): ChatMessage =
            ChatMessage(
                messageID = row[ChatMessages.messageID],
                date = row[ChatMessages.date],
                message = row[ChatMessages.message],
                burrowID = row[ChatMessages.burrowID],
                userID = row[ChatMessages.userID],
            )

        /** Serializes a UUID. */
        object UUIDSerializer : KSerializer<UUID> {
            override val descriptor = PrimitiveSerialDescriptor("UUID", PrimitiveKind.STRING)

            override fun deserialize(decoder: Decoder): UUID {
                return UUID.fromString(decoder.decodeString())
            }

            override fun serialize(encoder: Encoder, value: UUID) {
                encoder.encodeString(value.toString())
            }
        }
    }
}
