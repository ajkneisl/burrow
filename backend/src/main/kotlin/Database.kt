package app.burrow

import io.r2dbc.postgresql.PostgresqlConnectionConfiguration
import io.r2dbc.postgresql.PostgresqlConnectionFactory
import io.r2dbc.spi.IsolationLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.vendors.PostgreSQLDialect
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabaseConfig
import org.jetbrains.exposed.v1.r2dbc.R2dbcTransaction
import org.jetbrains.exposed.v1.r2dbc.SchemaUtils
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.reflections.Reflections
import org.slf4j.LoggerFactory

var DB: R2dbcDatabase? = null

/** Create a suspended transactions with [block]. */
suspend fun <T> query(block: suspend R2dbcTransaction.() -> T): T =
    withContext(Dispatchers.IO) { suspendTransaction(DB, block) }

private val runningDocker = env("DOCKER")?.toBoolean() == true
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
        val allTables =
            Reflections("app.burrow")
                .getSubTypesOf(Table::class.java)
                .mapNotNull { table -> table.kotlin.objectInstance }

        SchemaUtils.createMissingTablesAndColumns(*allTables.toTypedArray())
    }

    LOGGER.debug("Connected to Database")
}
