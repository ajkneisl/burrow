import { dayLabel, formatDateTime, humanDateLabel } from "@api/util.ts"
import { useQuery } from "@tanstack/react-query"
import type { BurrowResponse } from "@features/burrows/burrows.types.ts"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import { Button, Card, ViewErrors } from "@umnburrow/core"
import { getSchedule } from "@features/burrows/burrows.api.ts"
import clsx from "clsx"

/**
 * A group of burrows.
 *
 * @param label The day the burrows occur.
 * @param items The burrows themselves.
 *
 * @see Schedule
 */
type Group = { label: string; items: BurrowResponse[] }

/**
 * The schedule section on the home page.
 *
 * @author AJ Kneisl
 */
export default function Schedule() {
    const nav = useNavigate()

    const { data, isLoading, error, refetch } = useQuery<BurrowResponse[]>({
        queryKey: ["schedule"],
        queryFn: getSchedule
    })

    const onClick = (burrowID: string) => nav(`/burrow/${burrowID}`)

    // load burrows into day by day groups
    const groups = useMemo(() => {
        if (!data) return []

        return data.reduce<Group[]>((acc, item) => {
            let label = "Projects"

            if (item.burrow.beginningTime !== 0)
                label = dayLabel(item.burrow.beginningTime)

            const last = acc[acc.length - 1]

            if (!last || last.label !== label)
                acc.push({ label, items: [item] })
            else last.items.push(item)

            return acc
        }, [])
    }, [data])

    return (
        <section className="w-full">
            {/* errors */}
            {error && (
                <ViewErrors clearErrors={refetch} errors={[`${error}`]} />
            )}

            {/* loading skeleton */}
            {isLoading && (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <div className="animate-pulse space-y-2">
                                <div className="bg-text/10 h-4 w-1/2 rounded" />
                                <div className="bg-text/10 h-3 w-1/3 rounded" />
                                <div className="bg-text/10 h-3 w-40 rounded" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* empty schedule */}
            {!isLoading && groups.length === 0 && !error && (
                <Card
                    aria-live="polite"
                    aria-label="No upcoming meetings"
                    className="border-text/40 text-text/50 flex h-24 w-full flex-col items-center justify-center border-2 border-dashed opacity-50 md:mt-8"
                >
                    <p className="text-center text-sm tracking-wide">
                        Your schedule is empty.
                    </p>

                    <Button
                        color="LINK"
                        className="!m-0 !p-0 !text-sm"
                        onClick={() => nav("/browse")}
                    >
                        Browse
                    </Button>
                </Card>
            )}

            {/* content */}
            {!isLoading && groups.length > 0 && (
                <div className="bg-background/30 flex min-w-[240px] flex-col gap-6 rounded-xl">
                    {groups.map((group) => (
                        // individual burrows
                        <section key={group.label}>
                            <h3 className="text-text/60 mb-2 text-sm font-semibold tracking-wide uppercase">
                                {group.label}
                            </h3>

                            <ul className="flex flex-col gap-3">
                                {group.items.map((it) => (
                                    <Card
                                        key={it.burrow.id}
                                        className={clsx(
                                            "from:card bg-gradient-to-br",
                                            it.burrow.kind === "PROJECT"
                                                ? "to-warn/40 hover:to-warn/60"
                                                : "to-success/40 hover:to-success/60"
                                        )}
                                        isHoverable={true}
                                        onClick={() => onClick(it.burrow.id)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            {/* burrow title */}
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

                                            {/* date of burrow */}
                                            <time
                                                className="text-text/80 text-sm"
                                                aria-label="Time range"
                                            >
                                                {it.burrow.kind === "PROJECT"
                                                    ? `Due ${humanDateLabel(
                                                          it.burrow.endTime
                                                      )}`
                                                    : formatDateTime(
                                                          it.burrow
                                                              .beginningTime,
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
