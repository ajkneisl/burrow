import { getClubHistory, humanDateLabel } from "@umnburrow/core/api"
import type { BurrowResponse } from "@umnburrow/core/api"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { ChevronLeft, Loader2 } from "lucide-react"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import { ViewErrors, Paginator } from "@umnburrow/core"
/**
 * View a club's Burrow history.
 *
 * @author AJ Kneisl
 */
export default function ClubHistory() {
    const { name } = useParams<{ name: string }>()
    const auth = useToken()
    const { isMod, data: club } = useClubRole(name ?? "")
    const [currentPage, setCurrentPage] = useState(1)

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }, [currentPage])

    const { data, isFetching, error, refetch } = useQuery({
        queryKey: ["clubHistory", name, currentPage],
        enabled: auth !== "" && !!name && isMod,
        queryFn: async () => await getClubHistory(name!, currentPage),
        refetchOnWindowFocus: false
    })

    const allBurrows: BurrowResponse[] = useMemo(
        () => data?.contents ?? [],
        [data]
    )

    // group burrows by their date
    const groupedByDate = useMemo(() => {
        const map = new Map<string, BurrowResponse[]>()

        allBurrows.forEach((burrow) => {
            const burrowDate = new Date(burrow.burrow.endTime)

            const key = burrowDate.toISOString().slice(0, 10)
            const list = map.get(key) ?? []

            list.push(burrow)
            map.set(key, list)
        })

        // sort entries
        const entries = Array.from(map.entries()).sort(([a], [b]) => {
            const aMs = new Date(a).getTime()
            const bMs = new Date(b).getTime()
            return bMs - aMs
        })

        return entries.map(([key, list]) => ({ key, list }))
    }, [allBurrows])

    if (error)
        return (
            // error
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            </main>
        )

    // the club query has resolved and the user isn't allowed to be here
    if (club && !isMod)
        return (
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <div className="rounded-2xl border border-primary/20 bg-card p-6 text-text shadow-sm">
                    <p className="text-sm font-medium">
                        You don't have access to this club's history.
                    </p>
                    <p className="mt-1 text-xs text-text/70">
                        Only moderators and administrators can view it.
                    </p>
                </div>
            </main>
        )

    return (
        <section className="mx-auto w-full max-w-4xl p-4 sm:p-6">
            <div className="mb-6">
                <Link
                    to={`/club/${name}`}
                    className="inline-flex items-center gap-1 text-sm text-text/60 transition-colors hover:text-text"
                >
                    <ChevronLeft className="size-4" />
                    {club?.club.displayName ?? "Back to club"}
                </Link>

                <h1 className="mt-2 text-2xl font-bold text-text">History</h1>

                <p className="text-sm text-text/60">
                    Every Burrow this club has held.
                </p>
            </div>

            {!data ? (
                // loading skeleton — also covers the club query still resolving,
                // which is what gates the history query on `isMod`
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-card-border bg-card p-4 shadow-sm"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-1 flex-col gap-2">
                                        <div className="h-5 w-48 animate-pulse rounded bg-hero" />
                                        <div className="h-3 w-32 animate-pulse rounded bg-hero" />
                                        <div className="mt-2 space-y-1.5">
                                            <div className="h-3 w-full animate-pulse rounded bg-hero" />
                                            <div className="h-3 w-3/4 animate-pulse rounded bg-hero" />
                                        </div>
                                    </div>
                                    <div className="size-10 animate-pulse rounded-full bg-hero" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="h-6 w-16 animate-pulse rounded-full bg-hero" />
                                        <div className="h-6 w-20 animate-pulse rounded-full bg-hero" />
                                    </div>
                                    <div className="h-6 w-24 animate-pulse rounded-full bg-hero" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {data && isFetching ? (
                // loading
                <div className="mb-4 text-right">
                    <span className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-3 py-1.5 text-xs font-medium text-info">
                        <Loader2 className="size-3 animate-spin" />
                        Updating…
                    </span>
                </div>
            ) : null}

            {data && groupedByDate.length === 0 && (
                // empty history
                <div className="rounded-2xl border border-primary/20 bg-card p-6 text-text shadow-sm">
                    <p className="text-sm font-medium">
                        This club hasn't held any Burrows yet.
                    </p>
                    <p className="mt-1 text-xs text-text/70">
                        Create one from the club page to get started!
                    </p>
                </div>
            )}

            {data && groupedByDate.length > 0 && (
                // view history
                <>
                    <div className="space-y-8">
                        {groupedByDate.map(
                            ({ key: dateKey, list: burrows }) => (
                                <div key={dateKey}>
                                    <h3 className="mb-4 flex items-center gap-3 text-base font-semibold text-text">
                                        {humanDateLabel(dateKey)}
                                        <span className="h-px flex-1 bg-text/10" />
                                    </h3>

                                    <div className="space-y-3">
                                        {burrows.map((m) => (
                                            <BurrowCard
                                                key={m.burrow.id}
                                                details={true}
                                                meetingResponse={m}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {data && (
                        <Paginator
                            currentPage={currentPage}
                            totalPages={data.totalPages}
                            totalResults={data.totalResults}
                            onPageChange={setCurrentPage}
                            isLoading={isFetching}
                        />
                    )}
                </>
            )}
        </section>
    )
}
