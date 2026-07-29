import { dayLabel } from "@api/util.ts"
import { useQuery } from "@tanstack/react-query"
import type { ScheduleBurrowResponse } from "@features/burrows/burrows.types.tsx"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Button, Card, ViewErrors } from "@umnburrow/core"
import { getSchedule } from "@features/burrows/burrows.api.ts"
import clsx from "clsx"
import { ChevronDown } from "lucide-react"
import ScheduleBurrowCard from "@features/burrows/components/ScheduleBurrowCard.tsx"

/**
 * A group of burrows.
 *
 * @param label The day the burrows occur.
 * @param items The burrows themselves.
 *
 * @see Schedule
 */
type Group = { label: string; items: ScheduleBurrowResponse[] }

/**
 * The schedule section on the home page.
 *
 * @author AJ Kneisl
 */
export default function Schedule() {
    const nav = useNavigate()

    const { data, isLoading, error, refetch } = useQuery<
        ScheduleBurrowResponse[]
    >({
        queryKey: ["schedule"],
        queryFn: getSchedule
    })

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

    // sort projects by due date (endTime)
    const sortedGroups = useMemo(() => {
        return groups.map((group) => {
            if (group.label === "Projects") {
                return {
                    ...group,
                    items: [...group.items].sort(
                        (a, b) => a.burrow.endTime - b.burrow.endTime
                    )
                }
            }
            return group
        })
    }, [groups])

    // count projects to determine initial expanded state
    const projectCount = useMemo(() => {
        const projectGroup = sortedGroups.find(
            (group) => group.label === "Projects"
        )
        return projectGroup?.items.length ?? 0
    }, [sortedGroups])

    // auto-collapse if more than 3 projects
    const [projectsExpanded, setProjectsExpanded] = useState(true)

    useEffect(() => {
        if (projectCount > 3) {
            setProjectsExpanded(false)
        }
    }, [projectCount])

    return (
        <section className="flex w-full flex-col gap-2">
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
                                <div className="h-4 w-1/2 rounded bg-text/10" />
                                <div className="h-3 w-1/3 rounded bg-text/10" />
                                <div className="h-3 w-40 rounded bg-text/10" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* empty schedule */}
            {!isLoading && sortedGroups.length === 0 && !error && (
                <Card
                    aria-live="polite"
                    aria-label="No upcoming meetings"
                    className="flex h-28 w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-card-border"
                >
                    <p className="text-center text-sm tracking-wide text-text/50">
                        Your schedule is empty.
                    </p>

                    <Button
                        color="LINK"
                        className="m-0! p-0! text-sm!"
                        onClick={() => nav("/browse")}
                    >
                        Browse Burrows
                    </Button>
                </Card>
            )}

            {/* content */}
            {!isLoading && sortedGroups.length > 0 && (
                <div className="flex flex-col gap-5">
                    {sortedGroups.map((group) => {
                        const isProjectGroup = group.label === "Projects"

                        return (
                            // individual burrows
                            <section key={group.label}>
                                {/* Header with optional collapse button for projects */}
                                {isProjectGroup ? (
                                    <button
                                        onClick={() =>
                                            setProjectsExpanded(
                                                !projectsExpanded
                                            )
                                        }
                                        aria-expanded={projectsExpanded}
                                        className="mb-2 flex w-full cursor-pointer items-center gap-3 text-left text-text/60 transition-colors hover:text-text"
                                    >
                                        <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wide uppercase">
                                            <ChevronDown
                                                className={clsx(
                                                    "size-4 transition-transform duration-300 ease-in-out",
                                                    !projectsExpanded &&
                                                        "-rotate-90"
                                                )}
                                            />
                                            {group.label}
                                        </span>

                                        <span className="rounded-full bg-text/10 px-2 py-0.5 text-xs font-semibold">
                                            {group.items.length}
                                        </span>

                                        <span className="flex-1 border-t border-card-border" />
                                    </button>
                                ) : (
                                    <div className="mb-2 flex items-center gap-3">
                                        <h4 className="text-sm font-semibold tracking-wide text-text/60 uppercase">
                                            {group.label}
                                        </h4>

                                        <span className="flex-1 border-t border-card-border" />
                                    </div>
                                )}

                                {/* Show items if not projects or if projects are expanded */}
                                {!isProjectGroup && (
                                    <div className="flex flex-col gap-3">
                                        {group.items.map((it) => (
                                            <ScheduleBurrowCard
                                                key={it.burrow.id}
                                                burrowResponse={it}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Animated project list */}
                                {isProjectGroup && (
                                    <div
                                        className={clsx(
                                            "grid transition-all duration-300 ease-in-out",
                                            projectsExpanded
                                                ? "grid-rows-[1fr] opacity-100"
                                                : "grid-rows-[0fr] opacity-0"
                                        )}
                                    >
                                        <div className="flex flex-col gap-3 overflow-hidden">
                                            {group.items.map((it) => (
                                                <ScheduleBurrowCard
                                                    key={it.burrow.id}
                                                    burrowResponse={it}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
