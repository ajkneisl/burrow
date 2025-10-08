package app.burrow

import app.burrow.account.USER_ROUTES
import app.burrow.account.VERIFIER
import app.burrow.groups.GROUP_ROUTES
import app.burrow.groups.chat.GROUP_CHAT_ROUTES
import app.burrow.notifications.NOTIFICATION_ROUTES
import app.burrow.notifications.createUniversalNotification
import com.codahale.metrics.Slf4jReporter
import dev.hayden.KHealth
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.metrics.dropwizard.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.websocket.*
import java.util.concurrent.TimeUnit
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    runBlocking { initDb() }

    install(SSE)
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(Json)
    }

    install(DropwizardMetrics) {
        Slf4jReporter.forRegistry(registry)
            .outputTo(LoggerFactory.getLogger("Call Logging"))
            .convertRatesTo(TimeUnit.SECONDS)
            .convertDurationsTo(TimeUnit.MILLISECONDS)
            .build()
            .start(10, TimeUnit.SECONDS)
    }
    install(AutoHeadResponse)
    install(StatusPages) {
        exception<CancellationException> { _, _ -> }

        exception<ServerError> { call, cause ->
            call.respond(HttpStatusCode.fromValue(cause.code), "Error: ${cause.message}")
        }
        exception<Throwable> { call, cause ->
            cause.printStackTrace()
            call.respondText(text = "500: $cause", status = HttpStatusCode.InternalServerError)
        }
    }

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

        anyHost()

        allowCredentials = true
        allowNonSimpleContentTypes = true
        allowSameOrigin = true

        allowHost("localhost:5173", schemes = listOf("http"))
        allowHost("127.0.0.1:5173", schemes = listOf("http"))
        allowHost("0.0.0.0:5173", schemes = listOf("http"))
        allowHost("umn.app", schemes = listOf("http", "https"))
    }

    install(DefaultHeaders) { header("X-Engine", "Burrow") }
    install(KHealth)
    install(ContentNegotiation) { json() }

    authentication {
        jwt("primary") {
            realm = "ajkn"
            verifier(VERIFIER)
            challenge { defaultScheme, realm ->
                call.respond(HttpStatusCode.Unauthorized, "Token is not valid or has expired")
            }
            validate { credential ->
                if (credential.payload.audience.contains("ajkn")) JWTPrincipal(credential.payload)
                else null
            }
        }
    }

    routing {
        singlePageApplication { react("frontend") }

        route("/api") {
            route("/notifications", NOTIFICATION_ROUTES)
            route("/groups/{id}", GROUP_CHAT_ROUTES)
            route("/user", USER_ROUTES)

            authenticate("primary") { route("/groups", GROUP_ROUTES) }
        }
    }
}
