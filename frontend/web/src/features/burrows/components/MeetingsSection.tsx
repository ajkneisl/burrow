import { dayLabel, formatDateTime } from "@api/util.ts"
import { useQuery } from "@tanstack/react-query"
import type { BurrowResponse } from "@features/burrows/burrows.types.ts"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import { Card } from "@umnburrow/core"

type Group = { label: string; items: BurrowResponse[] }

/**
 * Skeleton row for loading
 *
 * @see MeetingsSection
 */
function SkeletonRow() {
    return (
        <Card>
            <div className="animate-pulse space-y-2">
                <div className="bg-text/10 h-4 w-1/2 rounded" />
                <div className="bg-text/10 h-3 w-1/3 rounded" />
                <div className="bg-text/10 h-3 w-40 rounded" />
            </div>
        </Card>
    )
}

/**
 * @see MeetingsSection
 */
type MeetingsSectionProps = {
    queryKey: (string | number)[]
    queryFn: () => Promise<BurrowResponse[]>
    emptyText?: string
    skeletonCount?: number
}

/**
 * A reusable meetings section, used for `My Bookmarks` and `My Schedule`
 *
 * @param queryKey The key to reuse data if possible.
 * @param queryFn The function to retrieve the data.
 * @param emptyText When there's no elements
 * @param skeletonCount How many skeletons to load when loading
 * @constructor
 */
export default function MeetingsSection({
    queryKey,
    queryFn,
    emptyText = "Nothing upcoming.",
    skeletonCount = 3
}: MeetingsSectionProps) {
    const nav = useNavigate()

    const { data, isLoading, error, refetch, isFetching } = useQuery<
        BurrowResponse[]
    >({
        queryKey,
        queryFn
    })

    const onClick = (meetingId: string) => nav(`/meeting/${meetingId}`)

    const groups = useMemo(() => {
        if (!data) return []

        return data.reduce<Group[]>((acc, item) => {
            const label = dayLabel(item.burrow.beginningTime)
            const last = acc[acc.length - 1]
            if (!last || last.label !== label)
                acc.push({ label, items: [item] })
            else last.items.push(item)
            return acc
        }, [])
    }, [data])

    return (
        <section className="w-full">
            {error && (
                <div className="border-error/30 bg-error/10 text-error mb-4 rounded-2xl border p-4 text-sm">
                    Couldn't load data.{" "}
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
                <Card
                    aria-live="polite"
                    aria-label="No upcoming meetings"
                    className="border-text/40 text-text/50 flex h-24 w-full items-center justify-center border-2 border-dashed opacity-50 md:mt-8"
                >
                    <p className="text-center text-sm tracking-wide">
                        {emptyText}
                    </p>
                </Card>
            )}

            {!isLoading && groups.length > 0 && (
                <div className="bg-background/30 flex min-w-[240px] flex-col gap-6 rounded-xl pt-1">
                    {groups.map((group) => (
                        <section key={group.label}>
                            <h3 className="text-text/60 mb-2 text-sm font-semibold tracking-wide uppercase">
                                {group.label}
                            </h3>
                            <ul className="flex flex-col gap-3">
                                {group.items.map((it) => (
                                    <Card
                                        key={it.burrow.id}
                                        className="from:card to-success/40 hover:to-success/60 bg-gradient-to-br"
                                        isHoverable={true}
                                        onClick={() => onClick(it.burrow.id)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-text truncate text-base font-semibold">
                                                    {it.burrow.title}
                                                </h4>
                                                {it.burrow.kind && (
                                                    <span className="border-primary/15 bg-hero text-text/80 ml-3 rounded-full border px-2 py-0.5 text-xs">
                                                        {it.burrow.kind}
                                                    </span>
                                                )}
                                            </div>

                                            <time
                                                className="text-text/80 text-sm"
                                                aria-label="Time range"
                                            >
                                                {formatDateTime(
                                                    it.burrow.beginningTime,
                                                    it.burrow.endTime
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
