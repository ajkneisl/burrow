import { getApiConfig, getBaseUrl } from "./config"

/** Singleton promise so concurrent 401s only trigger one refresh. */
let refreshPromise: Promise<boolean> | null = null

/** Methods that are allowed to carry a body. */
const METHODS_WITH_BODY = ["POST", "PUT", "PATCH"]

/**
 * A body that is sent as-is rather than being JSON encoded. Used for photo,
 * banner and badge uploads.
 */
export type RawBody = Blob | ArrayBuffer | ArrayBufferView | string

/**
 * Options for a request.
 *
 * @param query The query parameters. `undefined` and `null` values are dropped.
 * @param data The body of the request. JSON encoded unless `contentType` is set.
 * @param headers Additional headers.
 * @param contentType Send `data` verbatim under this content type.
 * @param auth If the request should carry the user's access token.
 * @param signal An abort signal, combined with the configured timeout.
 */
export type RequestOptions<T> = {
    query?: Record<string, string | number | boolean | undefined>
    data?: T
    headers?: Record<string, string>
    contentType?: string
    auth?: boolean
    signal?: AbortSignal
}

/** Exchange a refresh token for new tokens, bypassing {@link request}. */
async function doRefresh(
    refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
    const response = await fetch(`${getBaseUrl()}/user/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) throw new Error("Refresh failed")

    return response.json()
}

/**
 * Refresh the session, clearing the stored tokens if it fails.
 *
 * @return If a new access token is now available.
 */
async function refreshSession(): Promise<boolean> {
    const { getRefreshToken, setToken, setRefreshToken, onUnauthorized } =
        getApiConfig()

    const currentRefreshToken = await getRefreshToken?.()

    if (!currentRefreshToken) {
        await setToken?.("")
        onUnauthorized?.()

        return false
    }

    try {
        const result = await doRefresh(currentRefreshToken)

        await setToken?.(result.token)
        await setRefreshToken?.(result.refreshToken)

        return true
    } catch {
        await setToken?.("")
        await setRefreshToken?.("")
        onUnauthorized?.()

        return false
    }
}

/**
 * Build the full URL for a request, appending any defined query parameters.
 */
function buildUrl(
    url: string,
    query: RequestOptions<unknown>["query"]
): string {
    const fullUrl = `${getBaseUrl()}${url}`

    if (!query) return fullUrl

    const params = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, String(value))
        }
    })

    const queryString = params.toString()

    return queryString ? `${fullUrl}?${queryString}` : fullUrl
}

/**
 * Read a response body, tolerating the empty and non-JSON responses the
 * backend returns for `204` and for plain text endpoints.
 */
async function readBody<R>(response: Response): Promise<R> {
    const contentLength = response.headers.get("content-length")
    const contentType = response.headers.get("content-type")

    if (
        response.status === 204 ||
        contentLength === "0" ||
        !contentType?.includes("application/json")
    ) {
        return undefined as R
    }

    return (await response.json()) as R
}

/** Reject with the backend's message when a response is not `ok`. */
async function rejectWithBody(response: Response): Promise<never> {
    try {
        const body = await response.json()

        return Promise.reject(body.message || body)
    } catch {
        return Promise.reject(
            `Request failed with status ${response.status}`
        )
    }
}

/**
 * Perform a fetch, applying the configured timeout and honouring a
 * caller-supplied abort signal.
 */
async function timedFetch(
    url: string,
    options: RequestInit,
    signal?: AbortSignal
): Promise<Response> {
    const { timeoutMs } = getApiConfig()

    if (!timeoutMs) {
        return fetch(url, { ...options, signal })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const abort = () => controller.abort()
    signal?.addEventListener("abort", abort)

    try {
        return await fetch(url, { ...options, signal: controller.signal })
    } finally {
        clearTimeout(timeout)
        signal?.removeEventListener("abort", abort)
    }
}

/**
 * Create an HTTP request to the backend.
 *
 * @see ApiConfig.baseUrl
 */
export async function request<T = unknown, R = unknown>(
    method: string,
    url: string,
    options: RequestOptions<T> = {}
): Promise<R> {
    const {
        query,
        data,
        headers = {},
        contentType,
        auth = true,
        signal
    } = options

    const { getToken } = getApiConfig()

    const fullUrl = buildUrl(url, query)
    const requestHeaders: Record<string, string> = { ...headers }

    if (auth) {
        const token = await getToken?.()

        if (!token) return Promise.reject("Unauthorized.")

        requestHeaders.Authorization = `Bearer ${token}`
    }

    const hasBody =
        data !== undefined &&
        data !== null &&
        METHODS_WITH_BODY.includes(method.toUpperCase())

    const fetchOptions: RequestInit = { method, headers: requestHeaders }

    if (hasBody) {
        requestHeaders["Content-Type"] = contentType ?? "application/json"

        fetchOptions.body = contentType
            ? (data as BodyInit)
            : JSON.stringify(data)
    }

    let response: Response

    try {
        response = await timedFetch(fullUrl, fetchOptions, signal)
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return Promise.reject("Request timeout - server did not respond")
        }

        return Promise.reject(
            `Network request failed: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
    }

    // attempt a token refresh on 401 (skipping the refresh endpoint itself)
    if (response.status === 401 && auth && !url.includes("/user/refresh")) {
        refreshPromise ??= refreshSession().finally(() => {
            refreshPromise = null
        })

        if (!(await refreshPromise)) return Promise.reject("Unauthorized.")

        // retry the original request with the new token
        const newToken = await getToken?.()

        if (newToken) requestHeaders.Authorization = `Bearer ${newToken}`

        const retry = await timedFetch(
            fullUrl,
            { ...fetchOptions, headers: requestHeaders },
            signal
        )

        if (!retry.ok) return rejectWithBody(retry)

        return readBody<R>(retry)
    }

    if (!response.ok) return rejectWithBody(response)

    return readBody<R>(response)
}

/**
 * GET request.
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
 * POST request.
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
 * PUT request.
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
 * PATCH request.
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
 * DELETE request.
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
