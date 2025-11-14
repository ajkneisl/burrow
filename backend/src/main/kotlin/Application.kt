package app.burrow

import app.burrow.account.Authorization
import app.burrow.account.USER_ROUTES
import app.burrow.account.models.getUserByUsername
import app.burrow.admin.ADMIN_ROUTES
import app.burrow.burrows.BURROW_ROUTES
import app.burrow.burrows.createStudyBurrow
import app.burrow.burrows.getBurrow
import app.burrow.burrows.getMeetingResponse
import app.burrow.burrows.models.BurrowType
import app.burrow.burrows.models.BurrowVisibility
import app.burrow.burrows.models.SubmittedBurrow
import app.burrow.burrows.sync.Sync
import app.burrow.notifications.NOTIFICATION_ROUTES
import app.burrow.notifications.notificationWorker
import app.burrow.report.REPORT_ROUTES
import dev.hayden.KHealth
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.BadRequestException
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
import io.ktor.util.date.getTimeMillis
import java.io.File
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import org.slf4j.event.Level

/** General, reusable HTTPClient */
val client = HttpClient(CIO)

val json = Json { ignoreUnknownKeys = true }

/** Burrow logger! */
val burrowLogger = LoggerFactory.getLogger("Burrow")

const val PRIMARY_AUTH = "primary"
const val ADMIN_AUTH = "administrator"

lateinit var FRONTEND_DIR: String

fun main(args: Array<String>) {
    // debug stuff
    args.forEach { arg ->
        when {
            arg.startsWith("--gen-token=") -> {
                val userId = arg.removePrefix("--gen-token=")

                burrowLogger.info("Generated Token: {}", Authorization.generateToken(userId))
            }

            arg.startsWith("--use-frontend=") -> {
                FRONTEND_DIR = arg.removePrefix("--use-frontend=")

                burrowLogger.info("Using frontend: {}", FRONTEND_DIR)
            }
        }
    }

    if (!::FRONTEND_DIR.isInitialized) {
        FRONTEND_DIR = "frontend"
    }

    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

suspend fun Application.module() {
    initDb()
    notificationWorker()

    // sse
    install(SSE)

    // websockets
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(Json)
    }

    install(CallLogging) {
        level = Level.INFO
        logger = burrowLogger

        format { call ->
            val status = call.response.status()?.value ?: "?"
            val method = call.request.httpMethod.value
            val uri = call.request.uri

            "$method ($status) $uri"
        }
    }

    install(AutoHeadResponse)
    install(StatusPages) {
        exception<CancellationException> { _, _ -> }

        @Serializable data class ErrorResponse<T>(val error: String?, val message: T?)

        exception<BadRequestException> { call, ex ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse("MalformedBody", "Invalid request body."),
            )
        }

        // this is the default error
        // contains invalid args, etc
        exception<ServerError> { call, cause ->
            call.respond(
                HttpStatusCode.fromValue(cause.code),
                ErrorResponse(cause::class.simpleName, cause.message),
            )
        }

        // multiple errors
        exception<MultiError> { call, cause ->
            call.respond(
                HttpStatusCode.fromValue(cause.code),
                ErrorResponse(cause::class.simpleName, cause.messages),
            )
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

        allowCredentials = true
        allowNonSimpleContentTypes = true
        allowSameOrigin = true

        allowHost("localhost:5173", schemes = listOf("http"))
        allowHost("127.0.0.1:5173", schemes = listOf("http"))
        allowHost("0.0.0.0:5173", schemes = listOf("http"))
        allowHost("umn.app", schemes = listOf("http", "https"))
    }

    install(DefaultHeaders) { header("X-Engine", "Burrow") }
    install(ContentNegotiation) { json(json) }

    install(KHealth)

    authentication {
        // PRIMARY
        // this is for all regular account stuff
        // this is accessible by anyone with a
        // regular account
        jwt(PRIMARY_AUTH) {
            realm = "burrow"
            verifier(Authorization.getVerifier())

            challenge { _, _ -> throw Error(401, "Token is invalid or expired.") }
            validate { credential ->
                if (credential.payload.audience.contains(Authorization.PUBLIC_AUDIENCE))
                    JWTPrincipal(credential.payload)
                else null
            }
        }

        // ADMINISTRATOR
        // for all administrator actions, requires
        // a special account
        jwt(ADMIN_AUTH) {
            realm = "burrow/administrator"
            verifier(Authorization.getVerifier(Authorization.ADMIN_AUDIENCE))

            challenge { _, _ -> throw Error(401, "Token is invalid or expired.") }
            validate { credential ->
                if (credential.payload.audience.contains(Authorization.ADMIN_AUDIENCE))
                    JWTPrincipal(credential.payload)
                else null
            }
        }
    }
    try {
        routing {
            route("/api") {
                // ROUTE /api/admin
                // all
                route("/admin", ADMIN_ROUTES)

                // ROUTE /api/notifications
                // manage notifications
                route("/notifications", NOTIFICATION_ROUTES)

                // ROUTE /burrows/{id}
                // webhook sync
                route("/burrows/{id}", Sync.SYNC_ROUTES)

                // ROUTE /api/user
                // manage users / login
                route("/user", USER_ROUTES)

                // GET /groups/{id}
                // retrieve an individual meeting
                authenticate(PRIMARY_AUTH, optional = true) {
                    get("/burrows/{id}") {
                        val userId = call.principal<JWTPrincipal>()?.subject
                        val id =
                            call.parameters["id"]
                                ?: return@get call.respond(HttpStatusCode.BadRequest)

                        val meeting =
                            getMeetingResponse(id, userId)
                                ?: return@get call.respond(HttpStatusCode.NotFound)

                        call.respond(meeting)
                    }
                }

                authenticate(PRIMARY_AUTH) {
                    // ROUTE /api/burrows
                    // manage burrows
                    route("/burrows", BURROW_ROUTES)

                    // ROUTE /api/report
                    // manage reports
                    route("/report", REPORT_ROUTES)
                }

                // GET *
                // 404
                get("{...}") { throw NotFound("That page could not be found.") }
            }

            // ROUTE /admin
            // all administrator frontend page
            route("/admin") { singlePageApplication { react("admin") } }

            val baseHtml =
                runCatching { File("${FRONTEND_DIR}/index.html").readText() }.getOrNull()
                    ?: "hello!"

            val defaultMeta =
                MetaTags(
                    title = "Burrow — Study Together @ UMN",
                    description =
                        "Host and discover your next study group. Learn better with Burrow.",
                    image = "/image/burrow.png",
                )

            staticFiles("/assets", File("$FRONTEND_DIR/assets"))
            staticFiles("/image", File("$FRONTEND_DIR/image"))

            // GET /*
            // retrieve the frontend and inject SEO information
            get("{...}") {
                val path = call.request.uri

                // retrieve the meta depending on the URI
                val metaTags =
                    when {
                        // when they're requesting a meeting page
                        path.startsWith("/meeting/") || path.length == 9 -> {
                            val burrowID =
                                if (path.length == 9) path.removePrefix("/")
                                else path.removePrefix("/meeting/")

                            val burrow = getBurrow(burrowID)

                            defaultMeta.copy(
                                title = burrow?.title ?: defaultMeta.title,
                                description = burrow?.description ?: defaultMeta.description,
                                url = "https://umn.app$path",
                            )
                        }

                        // when they're requesting a user page
                        path.startsWith("/user/") -> {
                            val user =
                                path.removePrefix("/user/").split("/").firstOrNull()?.let {
                                    getUserByUsername(it)
                                }

                            defaultMeta.copy(
                                title = "${user?.username} on Burrow",
                                description = "View ${user?.username}'s profile on Burrow",
                                url = "https://umn.app$path",
                            )
                        }

                        else -> defaultMeta.copy(url = "https://umn.app$path")
                    }

                val htmlWithMeta = injectMetaTags(baseHtml, metaTags)
                call.respondText(htmlWithMeta, ContentType.Text.Html)
            }
        }
    } catch (t: Throwable) {
        burrowLogger.error("Unhandled in ${coroutineContext[CoroutineName]?.name}", t)
        throw t
    }
}
