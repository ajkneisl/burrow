import type { Article, SubmittedArticle } from "./article.models.ts"
import { BASE_URL } from "../auth/admin.atom.ts"

/**
 * Get all articles, including unpublished.
 *
 * @param token The authorization token.
 */
export async function getArticles(token: string): Promise<Article[]> {
    const res = await fetch(`${BASE_URL}/admin/articles`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}

/**
 * Create an article.
 *
 * @param token The authorization token.
 * @param article The article to create.
 */
export async function createArticle(
    token: string,
    article: SubmittedArticle
): Promise<Article> {
    const res = await fetch(`${BASE_URL}/admin/articles`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(article)
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}

/**
 * Update an article.
 *
 * @param token The authorization token.
 * @param slug The slug of the article to update.
 * @param article The new article details.
 */
export async function updateArticle(
    token: string,
    slug: string,
    article: SubmittedArticle
): Promise<Article> {
    const res = await fetch(`${BASE_URL}/admin/articles/${slug}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(article)
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}

/**
 * Delete an article.
 *
 * @param token The authorization token.
 * @param slug The slug of the article to delete.
 */
export async function deleteArticle(token: string, slug: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/articles/${slug}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }
}
