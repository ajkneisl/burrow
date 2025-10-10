import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type {
    GroupMeetingResponse,
    GroupType
} from "@features/groups/api/groups.types.ts"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import { GroupMeetingCard } from "@features/groups/components/GroupMeetingCard.tsx"
import { searchMeetings } from "@features/groups/api/groups.api.ts"

/**
 * Convert a date into a more readable one.
 *
 * @param key The readable date.
 */
function humanDateLabel(key: string): string {
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
 * {@link AllMeetings}
 */
type AllMeetingsProps = {
    type: GroupType
}

/**
 * Search through all meetings.
 *
 * @param type The type of meetings.
 */
export default function AllMeetings({ type }: AllMeetingsProps) {
    const [query, setQuery] = useState("")
    const [auth] = useAtom(authToken)
    const [selectedDate, setSelectedDate] = useState<string>()

    const dateEpoch = useMemo(() => {
        if (!selectedDate) return null

        const parts = selectedDate.split("-")
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)

        // don't request until reaching a real year
        if (year < 2025) return null

        return new Date(year, month, day).valueOf()
    }, [selectedDate])

    const dayStart = useMemo(() => {
        const d = new Date(dateEpoch ?? new Date().getDate())
        d.setHours(0, 0, 0, 0)
        return d.getTime()
    }, [dateEpoch])

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ["meetings", type, query, dateEpoch],
        queryFn: async () =>
            await searchMeetings(auth, type, query, dateEpoch ?? undefined),
        refetchOnWindowFocus: false
    })

    const allMeetings: GroupMeetingResponse[] = useMemo(
        () => data ?? [],
        [data]
    )

    const filtered = useMemo(() => {
        const searchQuery = query.trim().toLowerCase()

        const byDate = allMeetings.filter((m) => {
            return m.meeting.beginningTime >= dayStart
        })

        return byDate
            .filter((meeting) => {
                return (
                    !searchQuery ||
                    meeting.meeting.title.toLowerCase().includes(searchQuery) ||
                    meeting.meeting.description
                        .toLowerCase()
                        .includes(searchQuery) ||
                    meeting.meeting.tags.some((tag) =>
                        tag.toLowerCase().includes(searchQuery)
                    )
                )
            })
            .sort((a, b) => a.meeting.beginningTime - b.meeting.beginningTime)
    }, [allMeetings, query, dayStart])

    const groupedByDate = useMemo(() => {
        const map = new Map<string, GroupMeetingResponse[]>()

        filtered.forEach((m) => {
            const key = new Date(m.meeting.beginningTime).toLocaleDateString()
            const list = map.get(key) ?? []
            list.push(m)
            map.set(key, list)
        })
        return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1))
    }, [filtered])

    if (error)
        return (
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-error">
                    Failed to load meetings.
                </div>
            </main>
        )

    return (
        <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
            {/* top controls */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* search */}
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search meetings…"
                        className="w-full rounded-2xl border border-primary/20 bg-card px-4 py-2 text-sm text-text shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                </div>

                {/* calendar */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm text-text shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Select date"
                    />
                </div>
            </div>

            {isLoading && !data ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-24 rounded-2xl bg-card shadow-sm"
                        />
                    ))}
                </div>
            ) : null}

            {!isLoading && isFetching ? (
                <div className="mb-2 text-right">
                    <span className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-2 py-1 text-xs text-info">
                        Updating…
                    </span>
                </div>
            ) : null}

            {/* search results */}
            {groupedByDate.length === 0 ? (
                <div className="rounded-2xl border border-primary/20 bg-card p-6 text-text shadow-sm">
                    <p className="text-sm">No meetings match your filters.</p>
                    <p className="mt-1 text-xs text-text/70">
                        Try adjusting your search or picking a different date.
                    </p>
                </div>
            ) : (
                groupedByDate.map(([dateKey, meetings]) => (
                    <section key={dateKey} className="mb-10">
                        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                            {humanDateLabel(dateKey)}
                            <span className="h-px flex-1 bg-primary/20" />
                        </h2>
                        <div className="flex flex-col gap-4">
                            {meetings.map((m) => (
                                <GroupMeetingCard key={m.meeting.id} {...m} />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </main>
    )
}
