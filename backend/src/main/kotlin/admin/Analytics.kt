package app.burrow.admin

import app.burrow.features.account.Users
import app.burrow.features.burrows.Burrows
import app.burrow.features.notifications.delivery.channels.Sse
import app.burrow.query
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.r2dbc.selectAll

@Serializable
data class Analytics(
    val userCount: Long,
    val activeUserCount: Int,
    val meetingCount: Long,
    val activeMeetingCount: Long,
)

suspend fun getAnalytics(): Analytics = query {
    val now = System.currentTimeMillis()

    val userCount = Users.selectAll().count()
    val meetingCount = Burrows.selectAll().count()
    val activeMeetingCount =
        Burrows.selectAll().where { Burrows.beginningTime lessEq now }.count()

    Analytics(
        userCount = userCount,
        activeUserCount = Sse.userCount.get(),
        meetingCount = meetingCount,
        activeMeetingCount = activeMeetingCount,
    )
}
