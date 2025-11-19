package app.burrow

import app.burrow.account.Users
import app.burrow.account.profile.Following
import app.burrow.account.profile.Profiles
import app.burrow.account.settings.Settings
import app.burrow.admin.account.Administrators
import app.burrow.burrows.bookmarks.Bookmarks
import app.burrow.burrows.invites.Invites
import app.burrow.burrows.invites.JoinRequests
import app.burrow.burrows.membership.Memberships
import app.burrow.burrows.models.Burrows
import app.burrow.burrows.sync.block.BlockStates
import app.burrow.burrows.sync.chat.ChatMessages
import app.burrow.notifications.NotificationPreferences
import app.burrow.notifications.Notifications
import app.burrow.notifications.delivery.PushSubscriptions
import app.burrow.report.Reports
import io.r2dbc.postgresql.PostgresqlConnectionConfiguration
import io.r2dbc.postgresql.PostgresqlConnectionFactory
import io.r2dbc.spi.IsolationLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.jetbrains.exposed.v1.core.vendors.PostgreSQLDialect
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabaseConfig
import org.jetbrains.exposed.v1.r2dbc.R2dbcTransaction
import org.jetbrains.exposed.v1.r2dbc.SchemaUtils
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.slf4j.LoggerFactory

var DB: R2dbcDatabase? = null

/** Create a suspended transactions with [block]. */
suspend fun <T> query(block: suspend R2dbcTransaction.() -> T): T =
    withContext(Dispatchers.IO) { suspendTransaction(DB, block) }

private val runningDocker = System.getenv("DOCKER")?.toBoolean() == true
private val LOGGER = LoggerFactory.getLogger("Database")

/** Initialize and connect to the database. */
suspend fun initDb() {
    val address = if (runningDocker) "database" else "localhost"

    LOGGER.debug("Connecting (R2DBC) to {}", address)

    runCatching {
            val connectionFactory =
                PostgresqlConnectionFactory(
                    PostgresqlConnectionConfiguration.builder()
                        .host(address)
                        .port(5432)
                        .database("burrow")
                        .username("postgres")
                        .password("postgres")
                        .build()
                )

            DB =
                R2dbcDatabase.connect(
                    connectionFactory = connectionFactory,
                    databaseConfig =
                        R2dbcDatabaseConfig {
                            defaultMaxAttempts = 1
                            defaultR2dbcIsolationLevel = IsolationLevel.READ_COMMITTED
                            explicitDialect = PostgreSQLDialect()
                        },
                )
        }
        .getOrElse {
            println("FATAL: Failed to connect to database via R2DBC: ${it.message}")
            throw IllegalStateException("Database connection failed", it)
        }

    query {
        SchemaUtils.createMissingTablesAndColumns(
            Users,
            Burrows,
            Settings,
            NotificationPreferences,
            Notifications,
            Bookmarks,
            Memberships,
            Invites,
            JoinRequests,
            BlockStates,
            ChatMessages,
            Reports,
            Administrators,
            Profiles,
            Following,
            PushSubscriptions,
        )
    }

    LOGGER.debug("Connected to Database")
}
