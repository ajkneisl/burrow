package app.burrow

import app.burrow.admin.log.DB_LOG
import app.burrow.admin.log.DatabaseLogAppender
import app.burrow.api.configureErrors
import app.burrow.api.initDb
import app.burrow.api.workers.scheduleWorkers
import app.burrow.features.account.Authorization.configureAuthentication
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.LoggerContext
import dev.hayden.KHealth
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.request.*
import io.ktor.server.sse.*
import io.ktor.server.websocket.*
import kotlin.time.Duration.Companion.seconds
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import org.slf4j.event.Level

val json = Json {
    classDiscriminator = "type"
    ignoreUnknownKeys = true
}

val LOGGER = LoggerFactory.getLogger("Burrow")!!

var FRONTEND_DIR: String = "frontend"
var PORT: Int = 8080

/** Main function. This initializes database & schedules workers. */
suspend fun main(args: Array<String>) {
    LOGGER.info(DB_LOG, "Started Burrow Instance")

    initDb()
    parseArgs(args)
    scheduleWorkers()

    embeddedServer(Netty, port = PORT, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

/** Configures the Ktor webserver. */
suspend fun Application.module() {
    val loggerContext = LoggerFactory.getILoggerFactory() as LoggerContext
    val rootLogger = loggerContext.getLogger(Logger.ROOT_LOGGER_NAME)
    val dbAppender = DatabaseLogAppender()
    dbAppender.context = loggerContext
    dbAppender.start()
    rootLogger.addAppender(dbAppender)

    install(SSE)
    install(DefaultHeaders) { header("X-Engine", "Burrow") }
    install(KHealth)
    install(AutoHeadResponse)
    install(ContentNegotiation) { json(json) }

    // websockets
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(Json)
    }

    // call logging
    install(CallLogging) {
        level = Level.INFO
        logger = LOGGER

        format { call ->
            val status = call.response.status()?.value ?: "?"
            val method = call.request.httpMethod.value
            val uri = call.request.uri

            String.format("$method ($status) [%04d ms] $uri", call.processingTimeMillis())
        }
    }

    // CORS
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Get)

        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Cookie)
        allowHeader(HttpHeaders.SetCookie)
        allowHeader(HttpHeaders.Origin)
        allowHeader(HttpHeaders.Accept)
        allowHeader(HttpHeaders.LastEventID)
        allowHeader("x-badge-description")

        allowCredentials = true
        allowNonSimpleContentTypes = true
        allowSameOrigin = true

        allowHost("localhost:5173", schemes = listOf("http"))
        allowHost("127.0.0.1:5173", schemes = listOf("http"))
        allowHost("0.0.0.0:5173", schemes = listOf("http"))
        allowHost("umn.app", schemes = listOf("http", "https"))
    }

    configureAuthentication()
    configureErrors()
    configureRouting()
}
