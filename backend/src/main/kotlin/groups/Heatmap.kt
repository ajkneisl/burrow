package app.burrow.groups

import app.burrow.query
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.r2dbc.selectAll

/** Get a heatmap range. */
suspend fun getHeatmapRange(start: YearMonth, end: YearMonth): Map<String, Map<Int, Int>> {
    val zone = ZoneId.of("America/Chicago")

    val startDate = LocalDate.of(start.year, start.month, 1)
    val endDateExclusive = LocalDate.of(end.year, end.month, 1).plusMonths(1)

    val startMillis = startDate.atStartOfDay(zone).toInstant().toEpochMilli()
    val endMillis = endDateExclusive.atStartOfDay(zone).toInstant().toEpochMilli()

    return query {
        val buckets = linkedMapOf<String, MutableMap<Int, Int>>()

        var current = start

        // Inclusive of the end month
        while (!current.isAfter(end)) {
            val key = "%04d-%02d".format(current.year, current.monthValue)
            buckets.putIfAbsent(key, mutableMapOf())
            current = current.plusMonths(1)
        }

        Meetings.selectAll()
            .where {
                (Meetings.beginningTime greaterEq startMillis) and
                    (Meetings.beginningTime less endMillis)
            }
            .map {
                val ld = Instant.ofEpochMilli(it[Meetings.beginningTime]).atZone(zone).toLocalDate()
                val ym = "%04d-%02d".format(ld.year, ld.monthValue)
                val day = ld.dayOfMonth
                ym to day
            }
            .toList()
            .forEach { (ym, day) ->
                val monthMap = buckets.getOrPut(ym) { mutableMapOf() }
                monthMap[day] = (monthMap[day] ?: 0) + 1
            }

        buckets.mapValues { (_, days) -> days.toSortedMap() }
    }
}
