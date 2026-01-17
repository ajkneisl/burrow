import { authToken } from "@features/auth/auth.atom"
import { BASE_URL } from "@api/util"
import { store } from "@api/api.atom"

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
    const { query, data, headers = {}, auth = true } = options

    // make query parameters
    let fullUrl = `${BASE_URL}${url}`

    console.log(fullUrl)
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
    if (
        data &&
        methodsWithBody.includes(method.toUpperCase()) &&
        typeof data === "object"
    ) {
        requestHeaders["Content-Type"] = "application/json"
    }

    const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders
    }

    if (data && methodsWithBody.includes(method.toUpperCase())) {
        fetchOptions.body =
            typeof data === "string" ? data : JSON.stringify(data)
    }

    let response: Response
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        response = await fetch(fullUrl, {
            ...fetchOptions,
            signal: controller.signal
        })

        clearTimeout(timeoutId)
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return Promise.reject("Request timeout - server did not respond")
        }

        return Promise.reject(
            `Network request failed: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    if (!response.ok) {
        if (response.status === 401) {
            // TODO: proper way to sign the user out?
            await store.set(authToken, "")
            return undefined as R
        }

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
    const contentType = response.headers.get("content-type")

    if (
        response.status === 204 ||
        contentLength === "0" ||
        !contentType?.includes("application/json")
    ) {
        console.log("Empty or non-JSON response")
        return undefined as R
    }

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
