import { dayLabel, formatDateTime } from "@api/util.ts"

type Group = { label: string; items: GroupMeetingResponse[] }
import { useQuery } from "@tanstack/react-query"
import { getSchedule } from "@features/schedule/api/schedule.api.ts"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import Card from "@components/Card.tsx"

/**
 * An empty schedule entry.
 * @see Schedule
 */
function SkeletonRow() {
    return (
        <div className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm">
            <div className="animate-pulse space-y-2">
                <div className="h-4 w-1/2 rounded bg-text/10" />
                <div className="h-3 w-1/3 rounded bg-text/10" />
                <div className="h-3 w-40 rounded bg-text/10" />
            </div>
        </div>
    )
}

/**
 * The schedule element, seen on the homepage.
 * This shows the next 3 joined meetings and what time they're at.
 */
export default function Schedule() {
    const [auth] = useAtom(authToken)
    const nav = useNavigate()

    const { data, isLoading, error, refetch, isFetching } = useQuery<
        GroupMeetingResponse[]
    >({
        queryKey: ["schedule", "next"],
        queryFn: () => getSchedule(auth)
    })

    const onClick = (meetingId: string) => {
        nav(`/meeting/${meetingId}`)
    }

    const groups = useMemo(() => {
        // sort the data by the day label
        return (data ?? []).reduce<Group[]>((acc, item) => {
            const label = dayLabel(item.meeting.beginningTime)
            const last = acc[acc.length - 1]

            if (!last || last.label !== label)
                acc.push({ label, items: [item] })
            else last.items.push(item)

            return acc
        }, [])
    }, [data])

    return (
        <section className="w-full">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl figtree mt-8">My Schedule</h2>
            </div>

            {error && (
                <div className="mb-4 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
                    Couldn’t load schedule.{" "}
                    <button onClick={() => refetch()} className="underline">
                        Retry
                    </button>
                    {isFetching && <span className="ml-1 opacity-70">…</span>}
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col gap-3">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            )}

            {!isLoading && groups.length === 0 && !error && (
                <p className="text-text/70">Nothing upcoming.</p>
            )}

            {!isLoading && groups.length > 0 && (
                <div className="flex flex-col gap-6 min-w-[240px]">
                    {groups.map((group) => (
                        <section key={group.label}>
                            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text/60">
                                {group.label}
                            </h3>
                            <ul className="flex flex-col gap-3">
                                {group.items.map((it) => (
                                    <Card
                                        key={it.meeting.id}
                                        isHoverable={true}
                                        onClick={() => onClick(it.meeting.id)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="truncate text-base font-semibold text-text">
                                                    {it.meeting.title}
                                                </h4>
                                                {it.meeting.kind && (
                                                    <span className="ml-3 rounded-full border border-primary/15 bg-hero px-2 py-0.5 text-xs text-text/80">
                                                        {it.meeting.kind}
                                                    </span>
                                                )}
                                            </div>
                                            {it.meeting.location && (
                                                <div className="text-sm text-text/70">
                                                    {it.meeting.location}
                                                </div>
                                            )}
                                            <time
                                                className="text-sm text-text/80"
                                                aria-label="Time range"
                                            >
                                                {formatDateTime(
                                                    it.meeting.beginningTime,
                                                    it.meeting.endTime
                                                )}
                                            </time>
                                        </div>
                                    </Card>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </section>
    )
}
