import { get } from "../client"
import type { Article } from "./articles.models"

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
