import { del, get, post, put, request, type RawBody } from "../client"
import type { AccountType, Badge } from "../user/user.models"
import type { Article, SubmittedArticle } from "../articles/articles.models"
import type { Report } from "../reports/reports.models"
import type {
    AdminAccount,
    AnalyticsResponse,
    LogsResponse
} from "./admin.models"

/**
 * Get the requesting user's {@link AdminAccount}. Fails if the account is not
 * an administrator.
 */
export async function getAdmin(): Promise<AdminAccount> {
    return get("/admin")
}

/**
 * Get every administrator account.
 */
export async function getAdminAccounts(): Promise<AdminAccount[]> {
    return get("/admin/accounts")
}

/**
 * Change a user's account type.
 *
 * @param userID The ID of the user to change.
 * @param accountType The new account type.
 */
export async function setAccountType(
    userID: string,
    accountType: AccountType
): Promise<void> {
    return post(`/admin/accounts/${userID}`, { accountType })
}

/**
 * Fetch site-wide analytics.
 */
export async function getAnalytics(): Promise<AnalyticsResponse> {
    return get("/admin/analytics")
}

/**
 * Get logs, newest first.
 *
 * @param page The page number.
 * @param level Optional log level filter.
 * @param source Optional source filter.
 * @param userID Optional user ID filter.
 */
export async function getLogs(
    page: number = 1,
    level?: string,
    source?: string,
    userID?: string
): Promise<LogsResponse> {
    return get("/admin/logs", { query: { page, level, source, userID } })
}

/**
 * Get every report.
 */
export async function getReports(): Promise<Report[]> {
    return get("/admin/reports")
}

/**
 * Get every article, including unpublished ones.
 */
export async function getAllArticles(): Promise<Article[]> {
    return get("/admin/articles")
}

/**
 * Create an article.
 *
 * @param article The article to create.
 */
export async function createArticle(
    article: SubmittedArticle
): Promise<Article> {
    return put("/admin/articles", article)
}

/**
 * Update an article.
 *
 * @param slug The slug of the article to update.
 * @param article The new article details.
 */
export async function updateArticle(
    slug: string,
    article: SubmittedArticle
): Promise<Article> {
    return post(`/admin/articles/${slug}`, article)
}

/**
 * Delete an article.
 *
 * @param slug The slug of the article to delete.
 */
export async function deleteArticle(slug: string): Promise<void> {
    return del(`/admin/articles/${slug}`)
}

/**
 * Get every badge.
 */
export async function getBadges(): Promise<Badge[]> {
    return get("/admin/badges")
}

/**
 * Create a badge.
 *
 * @param id The badge ID.
 * @param description The badge description.
 * @param image The badge image.
 * @param contentType The MIME type of the image.
 */
export async function createBadge(
    id: string,
    description: string,
    image: RawBody,
    contentType: string
): Promise<void> {
    return request("PUT", `/admin/badges/${id}`, {
        data: image,
        contentType,
        headers: { "X-Badge-Description": description }
    })
}

/**
 * Delete a badge.
 *
 * @param id The badge ID to delete.
 */
export async function deleteBadge(id: string): Promise<void> {
    return del(`/admin/badges/${id}`)
}

/**
 * Get the badges assigned to a user.
 *
 * @param userID The user ID.
 */
export async function getUserBadges(userID: string): Promise<string[]> {
    return get(`/admin/badges/user/${userID}`)
}

/**
 * Replace the badges assigned to a user.
 *
 * @param userID The user ID.
 * @param badges The list of badge IDs to assign.
 */
export async function updateUserBadges(
    userID: string,
    badges: string[]
): Promise<void> {
    return post(`/admin/badges/user/${userID}`, { badges })
}
