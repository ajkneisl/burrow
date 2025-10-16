package app.burrow

import org.jetbrains.exposed.v1.core.StdOutSqlLogger
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.R2dbcTransaction
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.slf4j.LoggerFactory

private lateinit var DB: R2dbcDatabase

/** Create a suspended transactions with [block]. */
suspend fun <T> query(block: suspend R2dbcTransaction.() -> T): T =
    suspendTransaction(
        db = DB,
        statement = {
            addLogger(StdOutSqlLogger)
            block()
        },
    )

private val runningDocker = System.getenv("DOCKER")?.toBoolean() == true
private val logger = LoggerFactory.getLogger("Database")

/** Initialize and connect to the database. */
suspend fun initDb() {
    val address = if (runningDocker) "database" else "localhost"
    val postgresUrl = "r2dbc:postgresql://${address}:5432/burrow"

    logger.debug("Connecting (R2DBC) to {}", postgresUrl)

    DB =
        runCatching {
                R2dbcDatabase.connect(url = postgresUrl, user = "postgres", password = "postgres")
            }
            .getOrElse {
                println("FATAL: Failed to connect to database via R2DBC: ${it.message}")
                throw IllegalStateException("Database connection failed", it)
            }

    logger.debug("Connected to Database")
}
