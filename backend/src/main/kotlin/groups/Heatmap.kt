package app.burrow.groups

import app.burrow.query
import java.time.*
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** Get a heatmap of all created Burrow's within a month. */
suspend fun getHeatmap(): Map<Int, Int> {
    val zone = ZoneId.of("America/Chicago")
    val now = LocalDate.now(zone)
    val startOfMonth = now.withDayOfMonth(1).atStartOfDay(zone).toInstant().toEpochMilli()
    val endOfMonth =
        now.plusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant().toEpochMilli()

    return query {
        Meetings.selectAll()
            .where {
                (Meetings.beginningTime greaterEq startOfMonth) and
                    (Meetings.beginningTime less endOfMonth)
            }
            .map {
                Instant.ofEpochMilli(it[Meetings.beginningTime])
                    .atZone(zone)
                    .toLocalDate()
                    .dayOfMonth
            }
            .toList()
            .groupingBy { it }
            .eachCount()
            .toSortedMap()
    }
}
