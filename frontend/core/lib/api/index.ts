/**
 * The shared Burrow API layer.
 *
 * Every call the web app, mobile app and admin panel make to the backend lives
 * here, alongside the models those calls return. Nothing in this entry point
 * touches React, the DOM or React Native, so it is safe to import from any
 * client.
 *
 * Configure it once at startup:
 *
 * ```ts
 * configureApi({
 *     baseUrl: import.meta.env.VITE_BASE_URL,
 *     getToken: () => store.get(authToken)
 * })
 * ```
 */

export {
    configureApi,
    getApiConfig,
    getBaseUrl,
    getCdnUrl,
    type ApiConfig,
    type TokenReader,
    type TokenWriter
} from "./config"

export {
    request,
    get,
    post,
    put,
    patch,
    del,
    type RawBody,
    type RequestOptions
} from "./client"

export type { PaginatedResponse } from "./types"

export * from "./utils"

export * from "./user/user.models"
export * from "./user/user.api"

export * from "./burrows/burrows.models"
export * from "./burrows/burrows.api"
export * from "./burrows/attendees.api"

export * from "./clubs/clubs.models"
export * from "./clubs/clubs.api"

export * from "./chat/chat.models"
export * from "./chat/chat.api"

export * from "./sync/sync.models"

export * from "./notifications/notifications.models"
export * from "./notifications/notifications.api"

export * from "./settings/settings.models"
export * from "./settings/settings.api"

export * from "./articles/articles.models"
export * from "./articles/articles.api"

export * from "./reports/reports.models"
export * from "./reports/reports.api"

export * from "./search/search.models"
export * from "./search/search.api"

export * from "./admin/admin.models"
export * from "./admin/admin.api"
