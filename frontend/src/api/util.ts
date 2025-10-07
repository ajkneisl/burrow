import { atomWithStorage } from "jotai/utils"
import "cookie-store"

export const BASE_URL = import.meta.env.VITE_BASE_URL

/**
 * Label a date.
 *
 * @param ts The time.
 */
export function dayLabel(ts: number) {
    const d = new Date(ts)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const same = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

    if (same(d, today)) return "Today"
    if (same(d, tomorrow)) return "Tomorrow"
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

/**
 * Format a date and time. Returns in a format similar to `Today, 9:00 AM — 10:00 AM`
 *
 * @param startTime The start of a meeting.
 * @param endTime The end of a meeting.
 */
export function formatDateTime(startTime: number, endTime: number) {
    let builtStr = ""

    const today = new Date()
    const meetingDate = new Date(startTime)
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const isToday =
        meetingDate.getFullYear() === today.getFullYear() &&
        meetingDate.getMonth() === today.getMonth() &&
        meetingDate.getDate() === today.getDate()

    const isTomorrow =
        meetingDate.getFullYear() === tomorrow.getFullYear() &&
        meetingDate.getMonth() === tomorrow.getMonth() &&
        meetingDate.getDate() === tomorrow.getDate()

    if (isToday) builtStr += "Today"
    else if (isTomorrow) builtStr += "Tomorrow"
    else
        builtStr += meetingDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        })

    // the meeting time
    const beginningDate = new Date(startTime)
    const endDate = new Date(endTime)

    // extra options exclude da seconds
    builtStr += `, ${beginningDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })} — ${endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })}`

    return builtStr
}

/**
 * Format time in a means of "x ago"
 *
 * @param ms The milliseconds timestamp.
 */
export const formatTimeAgo = (ms: number) => {
    const diff = Date.now() - ms
    const sec = Math.round(diff / 1000)
    if (sec < 60) return `${sec}s ago`
    const min = Math.round(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.round(min / 60)
    if (hr < 24) return `${hr}h ago`
    const d = Math.round(hr / 24)
    if (d < 7) return `${d}d ago`
    return new Date(ms).toLocaleString()
}

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

// --- Cookie helpers that work with or without the Cookie Store API ---
type CookieStoreLike = {
    get?: (name: string) => Promise<{ name: string; value: string } | null>
    set?: (name: string, value: string) => Promise<void>
    delete?: (name: string) => Promise<void>
}

const CookieStoreGlobal: CookieStoreLike | undefined = (globalThis as any)
    .CookieStore || (globalThis as any).cookieStore

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

async function cookieSet(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 365): Promise<void> {
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
            try { await cookieSet(key, initialValue) } catch {}
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
                return () => { stopped = true }
            }
        }
    )
}
