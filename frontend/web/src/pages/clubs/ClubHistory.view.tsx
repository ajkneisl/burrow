import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { ChevronLeft, Loader2 } from "lucide-react"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import { getClubHistory } from "@features/clubs/clubs.api.ts"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import { ViewErrors, Paginator } from "@umnburrow/core"
import { humanDateLabel } from "@api/util.ts"

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
                <div className="border-primary/20 bg-card text-text rounded-2xl border p-6 shadow-sm">
                    <p className="text-sm font-medium">
                        You don't have access to this club's history.
                    </p>
                    <p className="text-text/70 mt-1 text-xs">
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
                    className="text-text/60 hover:text-text inline-flex items-center gap-1 text-sm transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    {club?.club.displayName ?? "Back to club"}
                </Link>

                <h1 className="text-text mt-2 text-2xl font-bold">History</h1>

                <p className="text-text/60 text-sm">
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
                            className="bg-card border-card-border rounded-2xl border p-4 shadow-sm"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-1 flex-col gap-2">
                                        <div className="bg-hero h-5 w-48 animate-pulse rounded" />
                                        <div className="bg-hero h-3 w-32 animate-pulse rounded" />
                                        <div className="mt-2 space-y-1.5">
                                            <div className="bg-hero h-3 w-full animate-pulse rounded" />
                                            <div className="bg-hero h-3 w-3/4 animate-pulse rounded" />
                                        </div>
                                    </div>
                                    <div className="bg-hero h-10 w-10 animate-pulse rounded-full" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="bg-hero h-6 w-16 animate-pulse rounded-full" />
                                        <div className="bg-hero h-6 w-20 animate-pulse rounded-full" />
                                    </div>
                                    <div className="bg-hero h-6 w-24 animate-pulse rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {data && isFetching ? (
                // loading
                <div className="mb-4 text-right">
                    <span className="border-info/30 bg-info/10 text-info inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating…
                    </span>
                </div>
            ) : null}

            {data && groupedByDate.length === 0 && (
                // empty history
                <div className="border-primary/20 bg-card text-text rounded-2xl border p-6 shadow-sm">
                    <p className="text-sm font-medium">
                        This club hasn't held any Burrows yet.
                    </p>
                    <p className="text-text/70 mt-1 text-xs">
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
                                    <h3 className="text-text mb-4 flex items-center gap-3 text-base font-semibold">
                                        {humanDateLabel(dateKey)}
                                        <span className="bg-text/10 h-px flex-1" />
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
