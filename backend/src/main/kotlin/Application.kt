package app.burrow

import app.burrow.account.USER_ROUTES
import app.burrow.account.VERIFIER
import app.burrow.account.generateToken
import app.burrow.groups.GROUP_ROUTES
import app.burrow.groups.sync.Sync
import app.burrow.notifications.NOTIFICATION_ROUTES
import app.burrow.notifications.notificationWorker
import dev.hayden.KHealth
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.httpMethod
import io.ktor.server.request.uri
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.websocket.*
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.Json
import org.slf4j.event.Level

fun main(args: Array<String>) {
    // debug stuff
    args.forEach { arg ->
        when {
            arg.startsWith("--gen-token=") -> {
                val userId = arg.removePrefix("--gen-token=")

                println("Generated Token: " + generateToken(userId))
            }
        }
    }

    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

suspend fun Application.module() {
    initDb()
    notificationWorker()

    install(SSE)
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(Json)
    }

    install(CallLogging) {
        level = Level.INFO

        format { call ->
            val status = call.response.status()?.value ?: "?"
            val method = call.request.httpMethod.value
            val uri = call.request.uri

            "$method $uri -> $status"
        }
    }

    install(AutoHeadResponse)
    install(StatusPages) {
        exception<CancellationException> { _, _ -> }

        exception<ServerError> { call, cause ->
            call.respond(HttpStatusCode.fromValue(cause.code), "Error: ${cause.message}")
        }
        exception<Throwable> { call, cause ->
            cause.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
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
                if (credential.payload.audience.contains("Burrow")) JWTPrincipal(credential.payload)
                else null
            }
        }
    }

    routing {
        singlePageApplication { react("frontend") }

        route("/api") {
            route("/notifications", NOTIFICATION_ROUTES)
            route("/groups/{id}", Sync.SYNC_ROUTES)
            route("/user", USER_ROUTES)

            authenticate("primary") { route("/groups", GROUP_ROUTES) }
        }
    }
}
