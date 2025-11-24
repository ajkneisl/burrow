package app.burrow.account.chat

import kotlinx.serialization.Serializable

/**
 * A user's info for chat display.
 *
 * @param id The user's ID.
 * @param username The user's username.
 * @param name The user's profile name (if available).
 */
@Serializable data class ChatUser(val id: String, val username: String, val name: String? = null)
