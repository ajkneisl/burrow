import { dayLabel, formatDateTime } from "@api/util.ts"
import { useQuery } from "@tanstack/react-query"
import type { GroupMeetingResponse } from "@features/groups/groups.types.ts"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import { Card } from "@umnburrow/core"

type Group = { label: string; items: GroupMeetingResponse[] }

/**
 * Skeleton row for loading
 *
 * @see MeetingsSection
 */
function SkeletonRow() {
    return (
        <Card>
            <div className="animate-pulse space-y-2">
                <div className="h-4 w-1/2 rounded bg-text/10" />
                <div className="h-3 w-1/3 rounded bg-text/10" />
                <div className="h-3 w-40 rounded bg-text/10" />
            </div>
        </Card>
    )
}

/**
 * @see MeetingsSection
 */
type MeetingsSectionProps = {
    title: string
    queryKey: (string | number)[]
    queryFn: () => Promise<GroupMeetingResponse[]>
    emptyText?: string
    skeletonCount?: number
}

/**
 * A reusable meetings section, used for `My Bookmarks` and `My Schedule`
 *
 * @param title The title of the section.
 * @param queryKey The key to reuse data if possible.
 * @param queryFn The function to retrieve the data.
 * @param emptyText When there's no elements
 * @param skeletonCount How many skeletons to load when loading
 * @constructor
 */
export default function MeetingsSection({
    title,
    queryKey,
    queryFn,
    emptyText = "Nothing upcoming.",
    skeletonCount = 3
}: MeetingsSectionProps) {
    const nav = useNavigate()

    const { data, isLoading, error, refetch, isFetching } = useQuery<
        GroupMeetingResponse[]
    >({
        queryKey,
        queryFn
    })

    const onClick = (meetingId: string) => nav(`/meeting/${meetingId}`)

    const groups = useMemo(() => {
        if (!data) return []

        return data.reduce<Group[]>((acc, item) => {
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
                <h2 className="text-2xl figtree mt-8">{title}</h2>
            </div>

            {error && (
                <div className="mb-4 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
                    Couldn’t load data.{" "}
                    <button onClick={() => refetch()} className="underline">
                        Retry
                    </button>
                    {isFetching && <span className="ml-1 opacity-70">…</span>}
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: skeletonCount }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </div>
            )}

            {!isLoading && groups.length === 0 && !error && (
                <p className="text-text/70">{emptyText}</p>
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
