package app.burrow.burrows

import app.burrow.admin.log.DB_LOG
import app.burrow.burrows.models.Burrows
import app.burrow.notifications.rescheduleNotificationsForBurrow
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.launch
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update
import org.slf4j.LoggerFactory

/** A Burrow does not reoccur. */
const val NOT_REOCCURRING = -1

/** A Burrow that reoccurs every day. */
const val DAILY = 0

/** A Burrow that reoccurs every week. */
const val WEEKLY = 1

/** A Burrow that reoccurs every month. */
const val MONTHLY = 2

private val REOCCURRING_LOGGER = LoggerFactory.getLogger("Reoccurring")

/** Reoccurring worker. Finds all expired reoccurring Burrows and reschedules them properly. */
suspend fun reoccurringWorker() {
    REOCCURRING_LOGGER.info(DB_LOG, "Checking for reoccurring Burrows...")

    val expiredBurrows = query {
        Burrows.selectAll()
            .where {
                (Burrows.reoccurring neq NOT_REOCCURRING) and
                    (Burrows.endTime lessEq getTimeMillis())
            }
            .map(Burrow::fromRow)
            .toList()
    }

    coroutineScope {
        loop@ for (burrow in expiredBurrows) {
            launch {
                var newBeginning =
                    ZonedDateTime.ofInstant(
                        Instant.ofEpochMilli(burrow.beginningTime),
                        ZoneId.of("America/Chicago"),
                    )
                var newEnd =
                    ZonedDateTime.ofInstant(
                        Instant.ofEpochMilli(burrow.endTime),
                        ZoneId.of("America/Chicago"),
                    )

                // while statement go thru multiple cycles just in case burrow was down or something
                while (newEnd.toInstant().toEpochMilli() < getTimeMillis()) {
                    when (burrow.reoccurring) {
                        DAILY -> {
                            newBeginning = newBeginning.plusDays(1)
                            newEnd = newEnd.plusDays(1)
                        }

                        WEEKLY -> {
                            newBeginning = newBeginning.plusWeeks(1)
                            newEnd = newEnd.plusWeeks(1)
                        }

                        MONTHLY -> {
                            newBeginning = newBeginning.plusMonths(1)
                            newEnd = newEnd.plusMonths(1)
                        }

                        else -> continue
                    }
                }

                REOCCURRING_LOGGER.info(
                    DB_LOG,
                    "Updating {} to begin at {} and end at {}",
                    burrow.id,
                    newBeginning,
                    newEnd,
                )

                query {
                    Burrows.update({ Burrows.id eq burrow.id }) {
                        it[Burrows.beginningTime] = newBeginning.toInstant().toEpochMilli()
                        it[Burrows.endTime] = newEnd.toInstant().toEpochMilli()
                    }
                }

                rescheduleNotificationsForBurrow(burrow.id)
            }
        }
    }
}
