import { atomWithStorage } from "jotai/utils"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"

export const BASE_URL =
    Constants.expoConfig?.extra?.apiUrl || "https://umn.app/api"
export const CDN_URL = Constants.expoConfig?.extra?.cdnUrl || "https://cdn.umn.app"

/**
 * Convert a date into a more readable one.
 *
 * @param key The readable date.
 */
export function humanDateLabel(key: string | number): string {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    const keyDate = new Date(key)

    const isSame = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

    if (isSame(keyDate, today)) return "Today"
    if (isSame(keyDate, tomorrow)) return "Tomorrow"

    return keyDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
    })
}

/**
 * Turn a date into a week range label.
 *
 * @param dateMs
 */
export function weekRangeLabel(dateMs: number): string {
    const d = new Date(dateMs)
    d.setHours(0, 0, 0, 0)
    // Make Monday = 0, Sunday = 6
    const day = d.getDay()
    const offsetToMonday = (day + 6) % 7

    const start = new Date(d)
    start.setDate(d.getDate() - offsetToMonday)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const formatDay = (date: Date) => {
        const monthName = date.toLocaleString("default", { month: "long" })
        const day = date.getDate()
        const suffix =
            day % 10 === 1 && day !== 11
                ? "st"
                : day % 10 === 2 && day !== 12
                  ? "nd"
                  : day % 10 === 3 && day !== 13
                    ? "rd"
                    : "th"
        return `${monthName} ${day}${suffix}`
    }

    return `${formatDay(start)} — ${formatDay(end)}`
}

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
 * AsyncStorage wrapper for Jotai atoms (React Native equivalent of atomWithCookie)
 *
 * @param key The storage key.
 * @param initialValue The initial value.
 */
export function atomWithAsyncStorage<T extends string>(
    key: string,
    initialValue: T
) {
    return atomWithStorage<T>(`storage:${key}`, initialValue, {
        getItem: async (storageKey: string) => {
            try {
                const value = await AsyncStorage.getItem(key)
                return (value as T) ?? initialValue
            } catch (error) {
                console.error(`Error reading AsyncStorage key "${key}":`, error)
                return initialValue
            }
        },
        setItem: async (storageKey: string, value: T) => {
            try {
                await AsyncStorage.setItem(key, value as unknown as string)
            } catch (error) {
                console.error(`Error writing AsyncStorage key "${key}":`, error)
            }
        },
        removeItem: async (storageKey: string) => {
            try {
                await AsyncStorage.removeItem(key)
            } catch (error) {
                console.error(
                    `Error removing AsyncStorage key "${key}":`,
                    error
                )
            }
        },
        subscribe: (storageKey: string, callback: (value: T) => void) => {
            // AsyncStorage doesn't have native subscription support
            // For now, we'll use polling (can be improved with event emitters if needed)
            let stopped = false
            let prev: string | null | undefined

            const tick = async () => {
                if (stopped) return
                try {
                    const curr = await AsyncStorage.getItem(key)
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
    })
}

/**
 * Convert milliseconds to `mm:ss` format.
 *
 * @param ms The milliseconds.
 */
export function msToClock(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000))
    const mm = Math.floor(total / 60)
        .toString()
        .padStart(2, "0")
    const ss = (total % 60).toString().padStart(2, "0")
    return `${mm}:${ss}`
}

/**
 * Clamp a number between a floor and a ceiling.
 */
export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

/**
 * Convert a year into a textual graduation year, like `Senior`.
 * If this goes past the four most recent, it'll turn 2050 to '50.
 *
 * @param year The graduation year.
 */
export function convertGraduationYear(year: number | null) {
    if (year === null) return ""

    const currentYear = new Date().getFullYear()

    switch (year) {
        case currentYear + 1:
            return "Senior"
        case currentYear + 2:
            return "Junior"
        case currentYear + 3:
            return "Sophomore"
        case currentYear + 4:
            return "Freshman"
        default:
            return `'${year.toString().slice(2, 4)}`
    }
}

/**
 * Convert a HH:MM into milliseconds.
 *
 * @param dateMs The current date in milliseconds.
 * @param time The HH:MM date.
 */
export function addTime(dateMs: number, time: string): number {
    const timeSpl = time.split(":")

    return dateMs + +timeSpl[0] * 60 * 60 * 1000 + +timeSpl[1] * 60 * 1000
}

export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}
