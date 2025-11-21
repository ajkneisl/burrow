import { dayLabel } from "@api/util.ts"
import { useQuery } from "@tanstack/react-query"
import type { BurrowResponse } from "@features/burrows/burrows.types.ts"
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
            {!isLoading && sortedGroups.length === 0 && !error && (
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
            {!isLoading && sortedGroups.length > 0 && (
                <div className="bg-background/30 flex min-w-[240px] flex-col gap-6 rounded-xl">
                    {sortedGroups.map((group) => {
                        const isProjectGroup = group.label === "Projects"
                        const groupProjectCount = isProjectGroup
                            ? group.items.length
                            : 0

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
                                        className="text-text/60 hover:text-text mb-2 flex w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold tracking-wide uppercase transition-colors"
                                    >
                                        <ChevronDown
                                            className={clsx(
                                                "h-4 w-4 transition-transform duration-300 ease-in-out",
                                                !projectsExpanded &&
                                                    "-rotate-90"
                                            )}
                                        />

                                        <span>
                                            {group.label} ({groupProjectCount})
                                        </span>
                                    </button>
                                ) : (
                                    <h3 className="text-text/60 mb-2 text-sm font-semibold tracking-wide uppercase">
                                        {group.label}
                                    </h3>
                                )}

                                {/* Show items if not projects or if projects are expanded */}
                                {!isProjectGroup && (
                                    <ul className="flex flex-col gap-3">
                                        {group.items.map((it) => (
                                            <ScheduleBurrowCard
                                                burrowResponse={it}
                                            />
                                        ))}
                                    </ul>
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
                                        <ul
                                            className={clsx(
                                                "flex flex-col gap-3 overflow-hidden"
                                            )}
                                        >
                                            {group.items.map((it) => (
                                                <ScheduleBurrowCard
                                                    burrowResponse={it}
                                                />
                                            ))}
                                        </ul>
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
