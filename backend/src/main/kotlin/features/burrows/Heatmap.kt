package app.burrow.features.burrows

import app.burrow.features.burrows.models.enums.BurrowVisibility
import app.burrow.api.query
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
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

        while (!current.isAfter(end)) {
            val key = "%04d-%02d".format(current.year, current.monthValue)
            buckets.putIfAbsent(key, mutableMapOf())
            current = current.plusMonths(1)
        }

        Burrows.selectAll()
            .where {
                (Burrows.beginningTime greaterEq startMillis) and       // ensure correct timeframe
                    (Burrows.beginningTime less endMillis) and
                    (Burrows.visibility eq BurrowVisibility.PUBLIC)     // ensure burrow public
            }
            .map {
                val ld = Instant.ofEpochMilli(it[Burrows.beginningTime]).atZone(zone).toLocalDate()
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
