package app.burrow.features.articles

import app.burrow.api.Error
import app.burrow.api.NotFound
import app.burrow.api.throwIfNotEmpty
import app.burrow.api.urlParameter
import app.burrow.api.verify.verify
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route

/** Public routes involving articles. */
val ARTICLE_ROUTES: Route.() -> Unit = {
    // GET /articles
    // get all published articles
    get { call.respond(getPublishedArticles()) }

    // GET /articles/{slug}
    // get a published article
    get("/{slug}") {
        val slug = call.urlParameter("slug")

        val article =
            getPublishedArticle(slug) ?: throw NotFound("That article could not be found.")

        call.respond(article)
    }
}

// ROUTE /admin/articles
// manage articles
val ADMIN_ARTICLE_ROUTES: Route.() -> Unit = {
    // GET /admin/articles
    // get all articles, including unpublished
    get { call.respond(getAllArticles()) }

    // PUT /admin/articles
    // create an article
    put {
        val article = call.receive<SubmittedArticle>()

        article.verify().throwIfNotEmpty()

        if (getArticle(article.slug) != null) {
            throw Error(409, "An article with that slug already exists.")
        }

        call.respond(HttpStatusCode.Created, createArticle(article))
    }

    // ROUTE /admin/articles/{slug}
    // manage individual articles
    route("/{slug}") {
        // GET /admin/articles/{slug}
        // get an article, including unpublished
        get {
            val slug = call.urlParameter("slug")

            val article = getArticle(slug) ?: throw NotFound("That article could not be found.")

            call.respond(article)
        }

        // POST /admin/articles/{slug}
        // update an article
        post {
            val slug = call.urlParameter("slug")
            val article = call.receive<SubmittedArticle>()

            article.verify().throwIfNotEmpty()

            // prevent renaming onto an existing article
            if (article.slug != slug && getArticle(article.slug) != null) {
                throw Error(409, "An article with that slug already exists.")
            }

            val updated =
                updateArticle(slug, article)
                    ?: throw NotFound("That article could not be found.")

            call.respond(updated)
        }

        // DELETE /admin/articles/{slug}
        // delete an article
        delete {
            val slug = call.urlParameter("slug")

            if (!deleteArticle(slug)) {
                throw NotFound("That article could not be found.")
            }

            call.respond(HttpStatusCode.OK)
        }
    }
}
