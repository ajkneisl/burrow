package app.burrow.account.settings

import app.burrow.InvalidArguments
import app.burrow.account.models.userID
import app.burrow.notifications.NotificationKind
import app.burrow.notifications.NotificationPreference
import app.burrow.notifications.getNotificationPreferencesForUser
import app.burrow.notifications.setNotificationPreference
import app.burrow.query
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import org.jetbrains.exposed.v1.r2dbc.upsert

/** Routes relating to user settings. */
val SETTINGS_ROUTES: Route.() -> Unit = {
    // POST /settings/notifications
    // save notification preferences for a user
    post("/notifications") {
        val request = call.receive<SaveNotificationPreferencesRequest>()
        val userID = call.userID

        request.preferences.forEach { pref ->
            val notificationPreference =
                NotificationPreference(
                    userID = userID,
                    kind = pref.kind,
                    enabled = pref.enabled,
                    leadMinutes = pref.leadMinutes.toShort(),
                    throttleMinutes = pref.throttleMinutes.toShort(),
                    deliveryChannels = pref.deliveryChannels.toShort(),
                )

            setNotificationPreference(notificationPreference)
        }

        call.respond(HttpStatusCode.OK)
    }

    // GET /settings/notifications
    // get all notification preferences for a user
    get("/notifications") {
        val userID = call.userID
        val preferences = getNotificationPreferencesForUser(userID)

        val response =
            preferences.map { pref ->
                NotificationPreferenceResponse(
                    kind = pref.kind,
                    enabled = pref.enabled ?: true,
                    leadMinutes = pref.leadMinutes?.toInt() ?: 0,
                    throttleMinutes = pref.throttleMinutes?.toInt() ?: 0,
                    deliveryChannels = pref.deliveryChannels?.toInt() ?: 0b111,
                )
            }

        call.respond(response)
    }

    // GET /settings/general
    // get general settings for a user
    get("/general") {
        val userID = call.userID

        val settings = query {
            Settings.selectAll().where { Settings.userID eq userID }.limit(1).firstOrNull()
        }

        val response =
            if (settings != null) {
                GeneralSettingsResponse(
                    notificationsEnabled = settings[Settings.notificationsEnabled],
                    defaultNotificationDelivery =
                        settings[Settings.defaultNotificationDelivery].toInt(),
                )
            } else {
                // Return defaults if no settings exist
                GeneralSettingsResponse(
                    notificationsEnabled = true,
                    defaultNotificationDelivery = 0b0011, // SSE + Email
                )
            }

        call.respond(response)
    }

    // POST /settings/general
    // update general settings for a user
    post("/general") {
        val request = call.receive<UpdateGeneralSettingsRequest>()
        val userID = call.userID

        query {
            val existing =
                Settings.selectAll().where { Settings.userID eq userID }.limit(1).firstOrNull()

            if (existing != null) {
                Settings.update({ Settings.userID eq userID }) {
                    it[Settings.notificationsEnabled] = request.notificationsEnabled
                    it[Settings.defaultNotificationDelivery] =
                        request.defaultNotificationDelivery.toShort()
                }
            } else {
                Settings.insert {
                    it[Settings.userID] = userID
                    it[Settings.notificationsEnabled] = request.notificationsEnabled
                    it[Settings.defaultNotificationDelivery] =
                        request.defaultNotificationDelivery.toShort()
                }
            }
        }

        call.respond(HttpStatusCode.OK)
    }

    // POST /settings/theme
    // update a user's theme
    post("/theme") {
        val theme =
            runCatching { Theme.valueOf(call.receiveText()) }.getOrNull()
                ?: throw InvalidArguments()

        query {
            Settings.upsert(Settings.userID) {
                it[Settings.userID] = call.userID
                it[Settings.theme] = theme
            }
        }

        call.respond(HttpStatusCode.OK)
    }

    // GET /settings/theme
    // get a user's theme
    get("/theme") {
        val settings = query {
            Settings.selectAll().where { Settings.userID eq call.userID }.limit(1).firstOrNull()
        }

        val theme = settings?.get(Settings.theme)?.toString() ?: "AUTO"

        call.respond(hashMapOf("theme" to theme))
    }
}

/** Request to save notification preferences. */
@Serializable
private data class SaveNotificationPreferencesRequest(
    val preferences: List<NotificationPreferenceRequest>
)

/** Individual notification preference in the request. */
@Serializable
private data class NotificationPreferenceRequest(
    val kind: NotificationKind,
    val enabled: Boolean,
    val leadMinutes: Int,
    val throttleMinutes: Int,
    val deliveryChannels: Int,
)

/** Response format for notification preferences. */
@Serializable
private data class NotificationPreferenceResponse(
    val kind: NotificationKind,
    val enabled: Boolean,
    val leadMinutes: Int,
    val throttleMinutes: Int,
    val deliveryChannels: Int,
)

/** Request to update general settings. */
@Serializable
private data class UpdateGeneralSettingsRequest(
    val notificationsEnabled: Boolean,
    val defaultNotificationDelivery: Int,
)

/** Response format for general settings. */
@Serializable
private data class GeneralSettingsResponse(
    val notificationsEnabled: Boolean,
    val defaultNotificationDelivery: Int,
)
