/**
 * Runtime configuration for the shared API layer.
 *
 * The API layer is platform agnostic — it never reads `import.meta.env`,
 * `expo-constants`, cookies or AsyncStorage itself. Each application wires
 * those in once at startup through {@link configureApi}.
 */

/** Reads the current token. May be synchronous or asynchronous. */
export type TokenReader = () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>

/** Persists a token. May be synchronous or asynchronous. */
export type TokenWriter = (token: string) => void | Promise<void>

/**
 * Configuration for the shared API layer.
 *
 * @param baseUrl The root URL of the Burrow backend, without a trailing slash.
 * @param cdnUrl The root URL of the CDN.
 * @param getToken Reads the current access token.
 * @param getRefreshToken Reads the current refresh token.
 * @param setToken Persists a rotated access token.
 * @param setRefreshToken Persists a rotated refresh token.
 * @param timeoutMs How long a request may run before it is aborted. Omit to
 *   disable the timeout entirely.
 * @param onUnauthorized Called when the session could not be refreshed and the
 *   user should be treated as logged out.
 */
export type ApiConfig = {
    baseUrl: string
    cdnUrl?: string
    getToken?: TokenReader
    getRefreshToken?: TokenReader
    setToken?: TokenWriter
    setRefreshToken?: TokenWriter
    timeoutMs?: number
    onUnauthorized?: () => void
}

let config: ApiConfig | null = null

/**
 * Configure the shared API layer. Call this once, before any request is made.
 *
 * @param next The configuration to apply.
 */
export function configureApi(next: ApiConfig): void {
    config = next
}

/**
 * The active configuration.
 *
 * @throws If {@link configureApi} has not been called yet.
 */
export function getApiConfig(): ApiConfig {
    if (config === null) {
        throw new Error(
            "@umnburrow/core: configureApi() must be called before any API request."
        )
    }

    return config
}

/**
 * The root URL of the Burrow backend.
 *
 * @see ApiConfig.baseUrl
 */
export function getBaseUrl(): string {
    return getApiConfig().baseUrl
}

/**
 * The root URL of the CDN.
 *
 * @see ApiConfig.cdnUrl
 */
export function getCdnUrl(): string {
    return getApiConfig().cdnUrl ?? ""
}
