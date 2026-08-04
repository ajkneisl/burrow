import { atomWithStorage } from "jotai/utils"
import "cookie-store"

/**
 * Platform specific glue for the web client. Everything shared with the mobile
 * app and the admin panel — the request client, the models and the formatting
 * helpers — lives in `@umnburrow/core/api`.
 */

export const BASE_URL = import.meta.env.VITE_BASE_URL
export const CDN_URL = import.meta.env.VITE_CDN_URL

/**
 * Get a cookie by its key.
 *
 * @param key The key of the cookie.
 */
function getCookie(key: string) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${key}=`)
    if (parts.length === 2) return parts.pop()!.split(";").shift()
}

type CookieStoreLike = {
    get?: (name: string) => Promise<{ name: string; value: string } | null>
    set?: (name: string, value: string) => Promise<void>
    delete?: (name: string) => Promise<void>
}

const CookieStoreGlobal: CookieStoreLike | undefined =
    (globalThis as any).CookieStore || (globalThis as any).cookieStore

async function cookieGet(name: string): Promise<string | null> {
    if (CookieStoreGlobal?.get) {
        const c = await CookieStoreGlobal.get(name)
        return c?.value ?? null
    }
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${encodeURIComponent(name)}=`)
    if (parts.length === 2) {
        const raw = parts.pop()!.split(";").shift()!
        try {
            return decodeURIComponent(raw)
        } catch {
            return raw
        }
    }
    return null
}

async function cookieSet(
    name: string,
    value: string,
    maxAgeSeconds = 60 * 60 * 24 * 365
): Promise<void> {
    if (CookieStoreGlobal?.set) {
        await CookieStoreGlobal.set(name, value)
        return
    }
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

async function cookieDelete(name: string): Promise<void> {
    if (CookieStoreGlobal?.delete) {
        await CookieStoreGlobal.delete(name)
        return
    }
    // Expire immediately
    document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`
}

export function atomWithCookie<T extends string>(key: string, initialValue: T) {
    // Seed the cookie if missing so SSR/first load has a value
    // (ignore errors if cookies are blocked)
    void (async () => {
        const existing = await cookieGet(key)
        if (existing === null) {
            try {
                await cookieSet(key, initialValue)
            } catch {}
        }
    })()

    return atomWithStorage<T>(
        `cookie:${key}`,
        (getCookie(key) as T) ?? initialValue,
        {
            getItem: async () => {
                const v = await cookieGet(key)
                return (v as T) ?? initialValue
            },
            setItem: async (_k, value) => {
                await cookieSet(key, value as unknown as string)
            },
            removeItem: async () => {
                await cookieDelete(key)
            },
            subscribe: (_k, callback) => {
                let stopped = false
                let prev: string | null | undefined

                const tick = async () => {
                    if (stopped) return
                    try {
                        const curr = await cookieGet(key)
                        if (curr !== prev) {
                            prev = curr
                            if (curr !== null) callback(curr as T)
                        }
                    } finally {
                        if (!stopped) setTimeout(tick, 1000)
                    }
                }

                // kick off polling
                void tick()

                // cleanup
                return () => {
                    stopped = true
                }
            }
        }
    )
}
