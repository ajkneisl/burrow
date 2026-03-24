package app.burrow.api

import app.burrow.env
import io.r2dbc.postgresql.PostgresqlConnectionConfiguration
import io.r2dbc.postgresql.PostgresqlConnectionFactory
import io.r2dbc.spi.IsolationLevel
import java.util.concurrent.ConcurrentHashMap
import kotlin.reflect.KClass
import kotlin.reflect.KParameter
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.primaryConstructor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.vendors.PostgreSQLDialect
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabase
import org.jetbrains.exposed.v1.r2dbc.R2dbcDatabaseConfig
import org.jetbrains.exposed.v1.r2dbc.R2dbcTransaction
import org.jetbrains.exposed.v1.r2dbc.SchemaUtils
import org.jetbrains.exposed.v1.r2dbc.transactions.suspendTransaction
import org.reflections.Reflections
import org.slf4j.LoggerFactory
import kotlin.reflect.KFunction

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
            Reflections("app.burrow").getSubTypesOf(Table::class.java).mapNotNull { table ->
                table.kotlin.objectInstance
            }

        allTables.forEach { table ->
            println("Working on: ${table.tableName}")
            SchemaUtils.createMissingTablesAndColumns(table)
        }
    }

    LOGGER.debug("Connected to Database")
}

/** Annotate a data class with its corresponding Exposed [Table] for use with [toEntity]. */
@Target(AnnotationTarget.CLASS) annotation class MappedTable(val table: KClass<out Table>)

@PublishedApi internal val tableAnnotationCache = ConcurrentHashMap<KClass<*>, Table>()

@PublishedApi
internal fun resolveTable(kClass: KClass<*>): Table =
    tableAnnotationCache.getOrPut(kClass) {
        val annotation =
            kClass.findAnnotation<MappedTable>()
                ?: error(
                    "${kClass.simpleName} has no @MappedTable annotation and no table was provided"
                )
        annotation.table.objectInstance
            ?: error("@MappedTable table for ${kClass.simpleName} must be an object")
    }

@PublishedApi
internal data class EntityMapping(
    val params: List<ParamMapping>,
    val constructor: KFunction<Any>,
)

@PublishedApi
internal data class ParamMapping(
    val param: KParameter,
    val column: Column<*>,
    val isJsonCollection: Boolean,
)

@PublishedApi
internal val entityMappingCache = ConcurrentHashMap<Pair<KClass<*>, Table>, EntityMapping>()

@PublishedApi
internal fun buildEntityMapping(kClass: KClass<*>, table: Table): EntityMapping {
    val constructor = kClass.primaryConstructor!!

    // Pre-compute snake_case -> camelCase for all columns once
    val columnsByName = table.columns.associateBy { it.name.snakeToCamel().lowercase() }

    val params =
        constructor.parameters.mapNotNull { param ->
            val column = columnsByName[param.name!!.lowercase()]
            if (column == null) {
                if (param.isOptional) return@mapNotNull null
                error("No column found for parameter '${param.name}' in table '${table.tableName}'")
            }
            val isJsonCollection =
                param.type.classifier in listOf(List::class, Set::class, Map::class, HashMap::class)
            ParamMapping(param, column, isJsonCollection)
        }

    return EntityMapping(params, constructor)
}

inline fun <reified T : Any> ResultRow.toEntity(table: Table? = null): T {
    val resolvedTable = table ?: resolveTable(T::class)
    val mapping =
        entityMappingCache.getOrPut(T::class to resolvedTable) {
            buildEntityMapping(T::class, resolvedTable)
        }

    val args = HashMap<KParameter, Any?>(mapping.params.size)
    for (pm in mapping.params) {
        val value = this[pm.column]
        args[pm.param] =
            if (pm.isJsonCollection && value is String) {
                Json.decodeFromString(serializer(pm.param.type), value)
            } else {
                value
            }
    }

    @Suppress("UNCHECKED_CAST")
    return mapping.constructor.callBy(args) as T
}

private fun String.snakeToCamel(): String =
    split("_")
        .mapIndexed { i, s -> if (i == 0) s else s.replaceFirstChar { it.uppercase() } }
        .joinToString("")
