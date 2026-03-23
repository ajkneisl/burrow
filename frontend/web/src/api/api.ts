import { authToken, refreshTokenAtom } from "@features/auth/auth.atom.ts"
import { BASE_URL } from "@api/util.ts"
import { store } from "@api/api.atom.ts"

/** Singleton promise to prevent concurrent refresh calls. */
let refreshPromise: Promise<boolean> | null = null

/** Exchange a refresh token for new tokens (raw fetch to avoid circular imports). */
async function doRefresh(
    refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
    const response = await fetch(`${BASE_URL}/user/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
    })
    if (!response.ok) throw new Error("Refresh failed")
    return response.json()
}

/**
 * Options for a request.
 *
 * @param query The query parameters.
 * @param data The body of the request.
 * @param headers The headers.
 * @param auth If the request is authorized.
 */
type RequestOptions<T> = {
    query?: Record<string, string | number | boolean | undefined>
    data?: T
    headers?: Record<string, string>
    contentType?: string
    auth?: boolean
}

/**
 * Create an HTTP request to the backend.
 *
 * @see BASE_URL
 */
export async function request<T = unknown, R = unknown>(
    method: string,
    url: string,
    options: RequestOptions<T> = {}
): Promise<R> {
    const { query, data, headers = {}, contentType, auth = true } = options

    // make query parameters
    let fullUrl = `${BASE_URL}${url}`
    if (query && Object.keys(query).length > 0) {
        const params = new URLSearchParams()

        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value))
            }
        })

        const queryString = params.toString()
        if (queryString) {
            fullUrl += `?${queryString}`
        }
    }

    const requestHeaders: Record<string, string> = {
        ...headers
    }

    if (auth) {
        const token = await store.get(authToken)

        if (token) {
            requestHeaders.Authorization = `Bearer ${token}`
        } else {
            return Promise.reject("Unauthorized.")
        }
    }

    const methodsWithBody = ["POST", "PUT", "PATCH"]
    if (data && methodsWithBody.includes(method.toUpperCase())) {
        requestHeaders["Content-Type"] = contentType ?? "application/json"
    }

    const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders
    }

    if (data && methodsWithBody.includes(method.toUpperCase())) {
        fetchOptions.body = contentType
            ? (data as BodyInit)
            : JSON.stringify(data)
    }

    const response = await fetch(fullUrl, fetchOptions)

    // attempt token refresh on 401 (skip for the refresh endpoint itself)
    if (
        response.status === 401 &&
        auth &&
        !url.includes("/user/refresh")
    ) {
        if (!refreshPromise) {
            refreshPromise = (async () => {
                try {
                    const currentRefreshToken =
                        await store.get(refreshTokenAtom)
                    if (!currentRefreshToken) return false

                    const result =
                        await doRefresh(currentRefreshToken)
                    await store.set(authToken, result.token)
                    await store.set(
                        refreshTokenAtom,
                        result.refreshToken
                    )
                    return true
                } catch {
                    // refresh failed — clear tokens
                    await store.set(authToken, "")
                    await store.set(refreshTokenAtom, "")
                    return false
                } finally {
                    refreshPromise = null
                }
            })()
        }

        const refreshed = await refreshPromise

        if (refreshed) {
            // retry the original request with the new token
            const newToken = await store.get(authToken)
            const retryHeaders = { ...requestHeaders }
            if (newToken) retryHeaders.Authorization = `Bearer ${newToken}`

            const retryResponse = await fetch(fullUrl, {
                ...fetchOptions,
                headers: retryHeaders
            })

            if (!retryResponse.ok) {
                try {
                    const body = await retryResponse.json()
                    return Promise.reject(body.message || body)
                } catch {
                    return Promise.reject(
                        `Request failed with status ${retryResponse.status}`
                    )
                }
            }

            const retryContentLength =
                retryResponse.headers.get("content-length")
            const retryContentType =
                retryResponse.headers.get("content-type")

            if (
                retryResponse.status === 204 ||
                retryContentLength === "0" ||
                !retryContentType?.includes("application/json")
            ) {
                return undefined as R
            }

            return (await retryResponse.json()) as R
        }

        return Promise.reject("Unauthorized.")
    }

    if (!response.ok) {
        try {
            const body = await response.json()

            return Promise.reject(body.message || body)
        } catch {
            return Promise.reject(
                `Request failed with status ${response.status}`
            )
        }
    }

    const contentLength = response.headers.get("content-length")
    const responseContentType = response.headers.get("content-type")

    if (
        response.status === 204 ||
        contentLength === "0" ||
        !responseContentType?.includes("application/json")
    ) {
        return undefined as R
    }

    // Parse and return JSON response
    const body = await response.json()
    return body as R
}

/**
 * GET request
 *
 * @param url The URL of the resource.
 * @param options The request options.
 *
 * @see request
 */
export function get<R = unknown>(
    url: string,
    options: Omit<RequestOptions<never>, "data"> = {}
): Promise<R> {
    return request<never, R>("GET", url, options)
}

/**
 * POST request
 *
 * @param url The URL of the resource.
 * @param data The body of the request.
 * @param options The request options.
 *
 * @see request
 */
export function post<T = unknown, R = unknown>(
    url: string,
    data?: T,
    options: Omit<RequestOptions<T>, "data"> = {}
): Promise<R> {
    return request<T, R>("POST", url, { ...options, data })
}

/**
 * PUT request
 *
 * @param url The URL of the resource.
 * @param data The body of the request.
 * @param options The request options.
 *
 * @see request
 */
export function put<T = unknown, R = unknown>(
    url: string,
    data?: T,
    options: Omit<RequestOptions<T>, "data"> = {}
): Promise<R> {
    return request<T, R>("PUT", url, { ...options, data })
}

/**
 * PATCH request
 *
 * @param url The URL of the resource.
 * @param data The body of the request.
 * @param options The request options.
 *
 * @see request
 */
export function patch<T = unknown, R = unknown>(
    url: string,
    data?: T,
    options: Omit<RequestOptions<T>, "data"> = {}
): Promise<R> {
    return request<T, R>("PATCH", url, { ...options, data })
}

/**
 * DELETE request
 *
 * @param url The URL of the resource.
 * @param options The request options.
 *
 * @see request
 */
export function del<R = unknown>(
    url: string,
    options: Omit<RequestOptions<never>, "data"> = {}
): Promise<R> {
    return request<never, R>("DELETE", url, options)
}
