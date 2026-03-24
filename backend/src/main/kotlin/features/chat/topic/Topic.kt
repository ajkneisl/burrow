package app.burrow.features.chat.topic

import app.burrow.api.MappedTable
import app.burrow.features.chat.ChatMessage
import app.burrow.features.chat.ChatMessages
import app.burrow.features.chat.ChatUser
import app.burrow.features.account.Users
import app.burrow.features.account.profile.Profiles
import app.burrow.features.burrows.sync.Chat
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.leftJoin
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/**
 * A global topic.
 *
 * @param id The unique topic ID.
 * @param name The name of the topic.
 * @param description Description of the topic.
 * @param createdBy The user who created this topic.
 * @param createdAt When the topic was created.
 * @param pinned Whether this topic is pinned. Pinned topics don't expire.
 * @param expiresAt When this topic expires.
 */
@Serializable
@MappedTable(Topics::class)
data class Topic(
    val id: String,
    val name: String,
    val description: String,
    val createdBy: String,
    val createdAt: Long,
    val pinned: Boolean = false,
    val expiresAt: Long? = null,
)

/**
 * Get a page of all topics.
 *
 * @param page The page of topics.
 * @param pageSize The size of [page]
 */
suspend fun getAllTopics(page: Int, pageSize: Int = 10): List<Topic> = query {
    val now = getTimeMillis()

    Topics.selectAll()
        .where {
            // pinned or not expired
            (Topics.pinned eq true) or (Topics.expiresAt.isNull()) or (Topics.expiresAt greater now)
        }
        // sort pinned first
        .orderBy(Topics.pinned, SortOrder.DESC)
        // otherwise order by descending
        .orderBy(Topics.createdAt, SortOrder.DESC)
        .offset(((page - 1) * pageSize).toLong())
        .limit(pageSize)
        .map { row -> row.toEntity<Topic>(Topics) }
        .toList()
}

/** Get a topic room by [topicID]. */
suspend fun getTopic(topicID: String): Topic? = query {
    Topics.selectAll()
        .where { Topics.id eq topicID }
        .map { row -> row.toEntity<Topic>(Topics) }
        .toList()
        .firstOrNull()
}

/** Default topic expiry: 7 days in milliseconds. */
private const val DEFAULT_TOPIC_EXPIRY_MS = 7L * 24 * 60 * 60 * 1000

/**
 * Create a new topic. Topics expire after 7 days of inactivity by default.
 *
 * @param name The name of the topic.
 * @param description The description of the topic.
 * @param createdBy The author's ID.
 */
suspend fun createTopic(name: String, description: String, createdBy: String): Topic = query {
    val now = getTimeMillis()
    val id = UUID.randomUUID().toString()
    val expiresAt = now + DEFAULT_TOPIC_EXPIRY_MS

    Topics.insert {
        it[Topics.id] = id
        it[Topics.name] = name
        it[Topics.description] = description
        it[Topics.createdBy] = createdBy
        it[Topics.createdAt] = now
        it[Topics.pinned] = false
        it[Topics.expiresAt] = expiresAt
    }

    Topic(id, name, description, createdBy, now, pinned = false, expiresAt = expiresAt)
}

/** Delete a topic by its [topicID]. */
suspend fun deleteTopic(topicID: String): Unit = query {
    Topics.deleteWhere { Topics.id eq topicID }
}

/**
 * Update a topic's pinned status.
 *
 * @param topicID The ID of the topic to update.
 * @param pinned Whether the topic should be pinned.
 * @return The updated topic, or null if not found.
 */
suspend fun updateTopicPinned(topicID: String, pinned: Boolean): Topic? {
    query { Topics.update({ Topics.id eq topicID }) { it[Topics.pinned] = pinned } }
    return getTopic(topicID)
}

/**
 * Create a message in a topic. Also extends the topic's expiry by 7 days (unless pinned).
 *
 * @param topicID The ID of the topic to insert the message into.
 * @param userID The ID of the user creating the message.
 * @param message The message contents.
 */
suspend fun createTopicMessage(topicID: String, userID: String, message: String): ChatMessage =
    query {
        val now = getTimeMillis()
        val id = UUID.randomUUID()

        ChatMessages.insert {
            it[ChatMessages.id] = id
            it[ChatMessages.parentID] = topicID
            it[ChatMessages.senderID] = userID
            it[ChatMessages.message] = message
            it[ChatMessages.createdAt] = now
        }

        // Extend topic expiry on activity (only if not pinned)
        Topics.update({ (Topics.id eq topicID) and (Topics.pinned eq false) }) {
            it[Topics.expiresAt] = now + DEFAULT_TOPIC_EXPIRY_MS
        }

        ChatMessage(id, topicID, userID, message, now)
    }

/**
 * Get a page of [ChatMessage]s for a topic.
 *
 * @param topicID The ID of the topic.
 * @param page The page of messages to retrieve.
 * @param pageSize The size of pages.
 */
suspend fun getTopicHistory(topicID: String, page: Int, pageSize: Int = 50): List<ChatMessage> =
    query {
        ChatMessages.selectAll()
            .where { ChatMessages.parentID eq topicID }
            .orderBy(ChatMessages.createdAt, SortOrder.DESC)
            .limit(pageSize)
            .offset((page * pageSize).toLong())
            .map { row -> row.toEntity<ChatMessage>(ChatMessages) }
            .toList()
            .reversed()
    }

/**
 * Get users by their IDs for chat display.
 *
 * @param userIDs The list of user IDs to look up.
 * @return List of [ChatUser] objects for the requested users.
 */
suspend fun getUsersByIDs(userIDs: List<String>): List<Chat.ChatMember> = query {
    Users.leftJoin(Profiles, { Users.id }, { Profiles.userID })
        .selectAll()
        .where { Users.id inList userIDs }
        .map { row ->
            Chat.ChatMember(
                userID = row[Users.id],
                username = row[Users.username],
                name = row[Profiles.name],
            )
        }
        .toList()
}
