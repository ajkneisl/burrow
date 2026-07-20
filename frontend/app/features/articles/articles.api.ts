import { get } from "@api/api"
import type { Article } from "@features/articles/articles.types"

/**
 * Get a published article by its slug.
 *
 * @param slug The slug of the article.
 */
export async function getArticle(slug: string): Promise<Article> {
    return get(`/articles/${slug}`, { auth: false })
}

/**
 * Get all published articles.
 */
export async function getArticles(): Promise<Article[]> {
    return get("/articles", { auth: false })
}
