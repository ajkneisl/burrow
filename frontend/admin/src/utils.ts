/**
 * How much time has elapsed since a date.
 * @param ms The date.
 */
export function timeAgo(ms: number): string {
    const diff = Date.now() - ms
    const s = Math.max(1, Math.floor(diff / 1000))
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d ago`
    const date = new Date(ms)
    return date.toLocaleString()
}