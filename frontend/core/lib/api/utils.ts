/**
 * Formatting helpers shared by every Burrow client. These are deliberately
 * platform agnostic — no DOM, no React Native.
 */

/** If two dates fall on the same calendar day. */
function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

/**
 * Convert a date into a more readable one.
 *
 * @param key A timestamp, or a `YYYY-MM-DD` date.
 */
export function humanDateLabel(key: string | number): string {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const keyDate =
        typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key)
            ? new Date(`${key}T00:00:00`)
            : new Date(key)

    if (isSameDay(keyDate, today)) return "Today"
    if (isSameDay(keyDate, tomorrow)) return "Tomorrow"

    return keyDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
    })
}

/**
 * Turn a date into a week range label, like `March 3rd — March 9th`.
 *
 * @param dateMs A timestamp within the week.
 */
export function weekRangeLabel(dateMs: number): string {
    const d = new Date(dateMs)
    d.setHours(0, 0, 0, 0)

    // Make Monday = 0, Sunday = 6
    const offsetToMonday = (d.getDay() + 6) % 7

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
 * Label a date, preferring `Today` and `Tomorrow`.
 *
 * @param ts The time.
 */
export function dayLabel(ts: number): string {
    const d = new Date(ts)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    if (isSameDay(d, today)) return "Today"
    if (isSameDay(d, tomorrow)) return "Tomorrow"

    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

/**
 * Format a date and time, like `Today, 9:00 AM — 10:00 AM`.
 *
 * @param startTime The start of a meeting.
 * @param endTime The end of a meeting.
 */
export function formatDateTime(startTime: number, endTime: number): string {
    const beginningDate = new Date(startTime)
    const endDate = new Date(endTime)

    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    let builtStr: string

    if (isSameDay(beginningDate, today)) builtStr = "Today"
    else if (isSameDay(beginningDate, tomorrow)) builtStr = "Tomorrow"
    else
        builtStr = beginningDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        })

    // extra options exclude the seconds
    return `${builtStr}, ${beginningDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })} — ${endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })}`
}

/**
 * Format a time as `x ago`.
 *
 * @param ms The milliseconds timestamp.
 */
export function formatTimeAgo(ms: number): string {
    const diff = Date.now() - ms

    const sec = Math.round(diff / 1000)
    if (sec < 60) return `${sec}s ago`

    const min = Math.round(sec / 60)
    if (min < 60) return `${min}m ago`

    const hr = Math.round(min / 60)
    if (hr < 24) return `${hr}h ago`

    const days = Math.round(hr / 24)
    if (days < 7) return `${days}d ago`

    return new Date(ms).toLocaleDateString()
}

/**
 * Convert milliseconds to `mm:ss` format.
 *
 * @param ms The milliseconds.
 */
export function msToClock(ms: number): string {
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
export function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n))
}

/**
 * Convert a year into a textual graduation year, like `Senior`. Anything
 * outside the four most recent turns 2050 into `'50`.
 *
 * @param year The graduation year.
 */
export function convertGraduationYear(year: number | null): string {
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
 * Add a `HH:MM` time onto a date.
 *
 * @param dateMs The date in milliseconds.
 * @param time The `HH:MM` time.
 */
export function addTime(dateMs: number, time: string): number {
    const [hours, minutes] = time.split(":")

    return dateMs + +hours * 60 * 60 * 1000 + +minutes * 60 * 1000
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalizeFirstLetter(val: string): string {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}
