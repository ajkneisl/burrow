package app.burrow

import app.burrow.account.Users
import app.burrow.groups.Meetings
import app.burrow.groups.bookmarks.Bookmarks
import app.burrow.groups.chat.ChatMessages
import app.burrow.groups.membership.Memberships
import app.burrow.notifications.Notifications
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.slf4j.LoggerFactory

/** Create a suspended transactions with [block]. */
suspend fun <T> query(block: suspend () -> T): T =
    newSuspendedTransaction(Dispatchers.IO) { block() }

private val runningDocker = System.getenv("DOCKER")?.toBoolean() == true
private val logger = LoggerFactory.getLogger("Database")

/** Initialize and connect to the database. */
suspend fun initDb() {
    val address = if (runningDocker) "database" else "localhost"
    val postgresUrl = "jdbc:postgresql://${address}:5432/burrow"

    logger.debug("Connecting to {}", postgresUrl)

    val failed =
        runCatching {
                Database.connect(
                    postgresUrl,
                    driver = "org.postgresql.Driver",
                    user = "postgres",
                    password = "postgres",
                )
            }
            .isFailure

    if (failed) {
        println("FATAL: Failed to connect to database.")
    }

    query {
        SchemaUtils.createMissingTablesAndColumns(
            Users,
            Meetings,
            Memberships,
            Bookmarks,
            ChatMessages,
            Notifications,
        )
    }
}
