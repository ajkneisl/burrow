package app.burrow.features.articles

import org.jetbrains.exposed.v1.core.Table

/** [Article] */
object Articles : Table("articles") {
    /** [Article.slug] */
    val slug = varchar("slug", 64)

    /** [Article.title] */
    val title = varchar("title", 255)

    /** [Article.description] */
    val description = varchar("description", 255).nullable()

    /** [Article.content] */
    val content = text("content")

    /** [Article.published] */
    val published = bool("published")

    /** [Article.createdAt] */
    val createdAt = long("created_at")

    /** [Article.updatedAt] */
    val updatedAt = long("updated_at")

    override val primaryKey = PrimaryKey(slug)
}
