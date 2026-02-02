package app.burrow

import app.burrow.account.Authorization
import app.burrow.account.USER_ROUTES
import app.burrow.account.chat.ChatSync
import app.burrow.account.models.Users
import app.burrow.account.models.getUserByUsername
import app.burrow.account.models.userID
import app.burrow.account.settings.SETTINGS_ROUTES
import app.burrow.admin.ADMIN_ROUTES
import app.burrow.admin.log.DB_LOG
import app.burrow.admin.log.DatabaseLogAppender
import app.burrow.burrows.BURROW_ROUTES
import app.burrow.burrows.createBurrow
import app.burrow.burrows.getBurrow
import app.burrow.burrows.getBurrowResponse
import app.burrow.burrows.models.BurrowKind
import app.burrow.burrows.models.BurrowVisibility
import app.burrow.burrows.models.SubmittedStudyEventBurrow
import app.burrow.burrows.sync.BurrowSync
import app.burrow.notifications.NOTIFICATION_ROUTES
import app.burrow.notifications.NotificationKind
import app.burrow.notifications.createNotification
import app.burrow.notifications.notificationWorker
import app.burrow.report.REPORT_ROUTES
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.LoggerContext
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
import io.ktor.server.plugins.*
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.websocket.*
import io.ktor.util.date.*
import java.io.File
import kotlin.random.Random
import kotlin.system.exitProcess
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.r2dbc.select
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.slf4j.event.Level

val json = Json {
    classDiscriminator = "type"
    ignoreUnknownKeys = true
}

val burrowLogger = LoggerFactory.getLogger("Burrow")

const val PRIMARY_AUTH = "primary"
const val ADMIN_AUTH = "administrator"

/** path for the frontend directory. */
lateinit var FRONTEND_DIR: String

/**
 * secrets from Bitwarden Secret Manager.
 *
 * please refer to Bitwarden's docs on the secret manager cli for this :)
 */
private val bwsEnv by lazy {
    hashMapOf<String, String>().apply {
        try {
            ProcessBuilder(
                    "bws",
                    "secret",
                    "list",
                    "--output",
                    "env",
                    "--access-token",
                    System.getenv("BWS_ACCESS_TOKEN"),
                )
                .start()
                .inputStream
                .bufferedReader()
                .forEachLine { line ->
                    val spl = line.split("=")

                    val varName = spl[0]
                    val varValue = spl[1].removeSurrounding("\"")

                    burrowLogger.debug("Found $varName in BWS")

                    put(varName, varValue)
                }
        } catch (ex: Exception) {
            ex.printStackTrace()
            burrowLogger.error("There was an issue loading secrets. Please check BWS.")
        }
    }
}

/** Retrieve an environment variable from Bitwarden, fallback to System if it's not there. */
fun env(name: String): String? = bwsEnv[name] ?: System.getenv(name)

suspend fun main(args: Array<String>) {
    var port = 8080

    burrowLogger.info(DB_LOG, "Started Burrow Instance")

    initDb()

    // debug stuff
    args.forEach { arg ->
        when {
            // generate a token for a given user ID
            arg.startsWith("--gen-token=") -> {
                val userID = arg.removePrefix("--gen-token=")

                burrowLogger.info("Generated Token: {}", Authorization.generateToken(userID))
            }

            // change frontend folder
            arg.startsWith("--use-frontend=") -> {
                FRONTEND_DIR = arg.removePrefix("--use-frontend=")

                burrowLogger.info("Using frontend: {}", FRONTEND_DIR)
            }

            // override port
            arg.startsWith("--use-port=") -> {
                port = arg.removePrefix("--use-port=").toInt()
            }

            // generate burrows
            arg.startsWith("--gen-burrow") -> {
                val burrowCount = arg.removePrefix("--gen-burrow=").toIntOrNull() ?: exitProcess(-1)

                burrowLogger.info("Generating {} Burrows, hold on!", burrowCount)

                query {
                    val userIDs = Users.select(Users.id).toList().map { it[Users.id] }

                    repeat(burrowCount) {
                        val userID = userIDs.random()

                        val now = getTimeMillis()
                        val thirtyDaysInMillis = 30L * 24 * 60 * 60 * 1000
                        val randomOffset = (Random.nextDouble() * thirtyDaysInMillis).toLong()
                        val beginningTime = now + randomOffset

                        val twoHoursInMillis = 2L * 60 * 60 * 1000
                        val endTime = beginningTime + twoHoursInMillis

                        createBurrow(
                            userID,
                            SubmittedStudyEventBurrow(
                                "burrow burrow burrow ${Random.nextDouble()}",
                                "this is a generated burrow :)",
                                "yord",
                                if (Random.nextBoolean()) BurrowKind.STUDY else BurrowKind.EVENT,
                                beginningTime,
                                endTime,
                                emptySet(),
                                Random.nextInt(5, 50),
                                BurrowVisibility.PUBLIC,
                                false,
                            ),
                        )
                    }
                }
            }
        }
    }

    // if not custom just use "frontend" folder
    if (!::FRONTEND_DIR.isInitialized) {
        FRONTEND_DIR = "frontend"
    }

    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

suspend fun Application.module() {
    notificationWorker()

    val loggerContext = LoggerFactory.getILoggerFactory() as LoggerContext
    val rootLogger = loggerContext.getLogger(Logger.ROOT_LOGGER_NAME)
    val dbAppender = DatabaseLogAppender()
    dbAppender.context = loggerContext
    dbAppender.start()
    rootLogger.addAppender(dbAppender)

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

    // call logging
    install(CallLogging) {
        level = Level.INFO
        logger = burrowLogger

        format { call ->
            val status = call.response.status()?.value ?: "?"
            val method = call.request.httpMethod.value
            val uri = call.request.uri

            String.format("$method ($status) [%04d ms] $uri", call.processingTimeMillis())
        }
    }

    // auto head
    install(AutoHeadResponse)

    // status page
    // handles errors
    install(StatusPages) {
        exception<CancellationException> { _, _ -> }

        @Serializable data class ErrorResponse<T>(val error: String?, val message: T?)

        exception<BadRequestException> { call, _ ->
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

        // generic error
        exception<Throwable> { call, cause ->
            call.principal<JWTPrincipal>()?.subject?.let { MDC.put("userID", it) }
            burrowLogger.error("Unhandled exception: ${cause.message ?: "Unknown error"}", cause)
            MDC.clear()

            cause.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
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

        allowCredentials = true
        allowNonSimpleContentTypes = true
        allowSameOrigin = true

        allowHost("localhost:5173", schemes = listOf("http"))
        allowHost("127.0.0.1:5173", schemes = listOf("http"))
        allowHost("0.0.0.0:5173", schemes = listOf("http"))
        allowHost("umn.app", schemes = listOf("http", "https"))
    }

    // default headers
    install(DefaultHeaders) { header("X-Engine", "Burrow") }

    // json serialization
    install(ContentNegotiation) { json(json) }

    // health routes
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

    routing {
        route("/api") {
            // ROUTE /api/admin
            // all admin functionality
            route("/admin", ADMIN_ROUTES)

            // ROUTE /api/notifications
            // manage notifications
            route("/notifications", NOTIFICATION_ROUTES)

            // ROUTE /burrows/{id}
            // webhook sync
            route("/burrows/{id}", BurrowSync.SYNC_ROUTES)

            // ROUTE /chat
            // global chat sync (DMs and topic rooms)
            route("/chat", ChatSync.CHAT_SYNC_ROUTES)

            // ROUTE /api/user
            // manage users / login
            route("/user", USER_ROUTES)

            // GET /groups/{id}
            // retrieve an individual meeting
            authenticate(PRIMARY_AUTH, optional = true) {
                get("/burrows/{id}") {
                    val userId = call.principal<JWTPrincipal>()?.subject
                    val id =
                        call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)

                    val meeting =
                        getBurrowResponse(id, userId)
                            ?: return@get call.respond(HttpStatusCode.NotFound)

                    call.respond(meeting)
                }
            }

            authenticate(PRIMARY_AUTH) {
                // GET /search
                // search through users and Burrows simultaneously
                get("/search") {
                    val query = call.queryParameter("query")
                    val page = call.optionalIntQueryParameter("page") ?: 1

                    call.respond(search(query, page, call.userID))
                }

                // ROUTE /debug
                // debug functionality
                route("/debug") {
                    // GET /debug/notification
                    // send a debug notification
                    get("/notification") {
                        createNotification(
                            "Debug Notification",
                            "This is a debug notification",
                            call.userID,
                            null,
                            NotificationKind.NEWSLETTER,
                        )

                        call.respond(HttpStatusCode.OK)
                    }
                }

                // ROUTE /api/settings
                // manage user settings
                route("/settings", SETTINGS_ROUTES)

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
            runCatching { File("${FRONTEND_DIR}/index.html").readText() }.getOrNull() ?: "hello!"

        val defaultMeta =
            MetaTags(
                title = "Burrow",
                description = "Host and discover your next study group. Learn better with Burrow.",
                image = "/image/burrow.png",
            )

        // GET /assets/*
        // frontend assets
        staticFiles("/assets", File("$FRONTEND_DIR/assets"))

        // GET /image/*
        // frontend images
        staticFiles("/image", File("$FRONTEND_DIR/image"))

        // GET /sw.ks
        // service worker
        get("/sw.js") { call.respondFile(File("$FRONTEND_DIR/js/sw.js")) }

        // GET /.well-known
        // handle well-known
        route("/.well-known") {
            // GET /.well-known/apple-app-site-association
            // handle rerouting ios
            get("/apple-app-site-association") {
                call.respondText(WELL_KNOWN_APPLE, ContentType.Application.Json)
            }

            // GET /.well-known/assetlinks.json
            // handle rerouting android
            get("/assetlinks.json") {
                call.respondText(WELL_KNOWN_ANDROID, ContentType.Application.Json)
            }
        }

        // GET /*
        // retrieve the frontend and inject SEO information
        get("{...}") {
            val path = call.request.uri

            // retrieve the meta depending on the URI
            val metaTags =
                when {
                    // when they're requesting a burrow page
                    path.startsWith("/meeting/") || path.startsWith("/burrow/") || path.length == 9 -> {
                        val burrowID =
                            if (path.length == 9) path.removePrefix("/")
                            else if (path.startsWith("/burrow/")) path.removePrefix("/burrow/")
                            else path.removePrefix("/meeting/")

                        val burrow = burrowID.runCatching { getBurrow(this) }.getOrNull()

                        if (burrow == null) defaultMeta.copy(url = "https://umn.app$path")
                        else
                            defaultMeta.copy(
                                title = "Burrow — ${burrow.title}",
                                description = "View ${burrow.title} on Burrow.",
                                url = "https://umn.app$path",
                                appArgument = "app.umn.burrow://burrow/$burrowID",
                            )
                    }

                    // when they're requesting a user page
                    path.startsWith("/user/") -> {
                        val username = path.removePrefix("/user/").split("/").firstOrNull()
                        val user = username?.runCatching { getUserByUsername(this) }?.getOrNull()

                        if (user == null) defaultMeta.copy(url = "https://umn.app$path")
                        else
                            defaultMeta.copy(
                                title = "Burrow — ${user.username}",
                                description = "View ${user.username}'s profile on Burrow",
                                url = "https://umn.app$path",
                                appArgument = "app.umn.burrow://user/${user.username}",
                            )
                    }

                    else -> defaultMeta.copy(url = "https://umn.app$path")
                }

            val htmlWithMeta = injectMetaTags(baseHtml, metaTags)
            call.respondText(htmlWithMeta, ContentType.Text.Html)
        }
    }
}
