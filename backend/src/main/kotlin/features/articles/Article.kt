package app.burrow.features.articles

import app.burrow.api.MappedTable
import app.burrow.api.query
import app.burrow.api.toEntity
import app.burrow.api.verify.Verifiable
import app.burrow.api.verify.VerificationScope
import app.burrow.api.verify.Verifier
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.r2dbc.deleteWhere
import org.jetbrains.exposed.v1.r2dbc.insert
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.jetbrains.exposed.v1.r2dbc.update

/** The pattern a [Article.slug] must follow. */
private val SLUG_REGEX = Regex("^[a-z0-9]+(?:-[a-z0-9]+)*$")

/** A single article. */
@Serializable
@MappedTable(Articles::class)
data class Article(
    /** The unique, URL-friendly identifier of the article. */
    val slug: String,

    /** The title of the article. */
    val title: String,

    /** A short description of the article, used for previews and SEO. */
    val description: String?,

    /** The markdown content of the article. */
    val content: String,

    /** Whether the article is publicly visible. */
    val published: Boolean,

    /** When the article was created. */
    val createdAt: Long,

    /** When the article was last updated. */
    val updatedAt: Long,
)

/** A submitted article. */
@Verifiable(with = SubmittedArticleVerifier::class)
@Serializable
data class SubmittedArticle(
    val slug: String,
    val title: String,
    val description: String? = null,
    val content: String,
    val published: Boolean = false,
)

class SubmittedArticleVerifier : Verifier<SubmittedArticle>() {
    override suspend fun VerificationScope<SubmittedArticle>.rules() {
        SubmittedArticle::slug {
            lengthIn(1..64, "Slug must be between 1 and 64 characters.")

            errorIf("Slug may only contain lowercase letters, numbers, and hyphens.") {
                !SLUG_REGEX.matches(it)
            }
        }

        SubmittedArticle::title {
            lengthIn(1..255, "Title must be between 1 and 255 characters.")
        }

        SubmittedArticle::content {
            lengthIn(1..100_000, "Content must be between 1 and 100,000 characters.")
        }

        check(SubmittedArticle::description) {
            errorIf("Description must be 255 characters or fewer.") { (it?.length ?: 0) > 255 }
        }
    }
}

/**
 * Get an [Article] by its [slug], regardless of published status.
 *
 * @param slug The slug of the article.
 */
suspend fun getArticle(slug: String): Article? = query {
    Articles.selectAll()
        .where { Articles.slug eq slug }
        .singleOrNull()
        ?.toEntity<Article>(Articles)
}

/**
 * Get a published [Article] by its [slug].
 *
 * @param slug The slug of the article.
 */
suspend fun getPublishedArticle(slug: String): Article? =
    getArticle(slug)?.takeIf { it.published }

/**
 * Get all [Article]s, newest first.
 *
 * @return A list of all [Article]s.
 */
suspend fun getAllArticles(): List<Article> = query {
    Articles.selectAll()
        .orderBy(Articles.createdAt, SortOrder.DESC)
        .map { row -> row.toEntity<Article>(Articles) }
        .toList()
}

/**
 * Get all published [Article]s, newest first.
 *
 * @return A list of all published [Article]s.
 */
suspend fun getPublishedArticles(): List<Article> = query {
    Articles.selectAll()
        .where { Articles.published eq true }
        .orderBy(Articles.createdAt, SortOrder.DESC)
        .map { row -> row.toEntity<Article>(Articles) }
        .toList()
}

/**
 * Create an [Article].
 *
 * @param article The details of the article.
 */
suspend fun createArticle(article: SubmittedArticle): Article {
    val now = getTimeMillis()

    query {
        Articles.insert {
            it[Articles.slug] = article.slug
            it[Articles.title] = article.title
            it[Articles.description] = article.description
            it[Articles.content] = article.content
            it[Articles.published] = article.published
            it[Articles.createdAt] = now
            it[Articles.updatedAt] = now
        }
    }

    return getArticle(article.slug)!!
}

/**
 * Update an [Article].
 *
 * @param slug The slug of the article to update.
 * @param article The new details of the article.
 */
suspend fun updateArticle(slug: String, article: SubmittedArticle): Article? {
    val updated = query {
        Articles.update({ Articles.slug eq slug }) {
            it[Articles.slug] = article.slug
            it[Articles.title] = article.title
            it[Articles.description] = article.description
            it[Articles.content] = article.content
            it[Articles.published] = article.published
            it[Articles.updatedAt] = getTimeMillis()
        }
    }

    return if (updated > 0) getArticle(article.slug) else null
}

/**
 * Delete an [Article].
 *
 * @param slug The slug of the article to delete.
 * @return If an article was deleted.
 */
suspend fun deleteArticle(slug: String): Boolean = query {
    Articles.deleteWhere { Articles.slug eq slug } > 0
}
