package app.burrow

import app.burrow.admin.ADMIN_ROUTES
import app.burrow.api.MetaTags
import app.burrow.api.NotFound
import app.burrow.api.WELL_KNOWN_ANDROID
import app.burrow.api.WELL_KNOWN_APPLE
import app.burrow.api.injectMetaTags
import app.burrow.api.optionalIntQueryParameter
import app.burrow.api.queryParameter
import app.burrow.features.account.Authorization.PRIMARY_AUTH
import app.burrow.features.account.USER_ROUTES
import app.burrow.features.account.models.userID
import app.burrow.features.account.settings.SETTINGS_ROUTES
import app.burrow.features.burrows.BURROW_ROUTES
import app.burrow.features.burrows.models.getBurrow
import app.burrow.features.burrows.models.getBurrowResponse
import app.burrow.features.burrows.sync.BurrowSync
import app.burrow.features.chat.ChatSync
import app.burrow.features.clubs.CLUB_ROUTES
import app.burrow.features.notifications.NOTIFICATION_ROUTES
import app.burrow.features.notifications.NotificationKind
import app.burrow.features.notifications.createNotification
import app.burrow.features.report.REPORT_ROUTES
import app.burrow.features.search
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.http.content.react
import io.ktor.server.http.content.singlePageApplication
import io.ktor.server.http.content.staticFiles
import io.ktor.server.request.uri
import io.ktor.server.response.respond
import io.ktor.server.response.respondFile
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import java.io.File

/** Configures routing. */
fun Application.configureRouting() {
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
                    val userID = call.principal<JWTPrincipal>()?.subject
                    val id =
                        call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)

                    val meeting =
                        getBurrowResponse(id, userID)
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

                // ROUTE /api/clubs
                // manage clubs
                route("/clubs", CLUB_ROUTES)

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

        // GET /sw.js
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
                    path.startsWith("/meeting/") ||
                        path.startsWith("/burrow/") ||
                        path.length == 9 -> {
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
                        val user =
                            username
                                ?.runCatching {
                                    app.burrow.features.account.models.getUserByUsername(this)
                                }
                                ?.getOrNull()

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
