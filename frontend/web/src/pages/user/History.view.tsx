import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import { getUserHistory } from "@features/burrows/burrows.api.ts"
import { ViewErrors } from "@umnburrow/core"
import { humanDateLabel } from "@api/util.ts"
import Paginator from "../../../../core/lib/components/Paginator.tsx"
import { Loader2, RotateCcw } from "lucide-react"
import CreateStudyBurrowModal from "@features/burrows/create/components/CreateStudyBurrowModal.tsx"
import CreateEventBurrowModal from "@features/burrows/create/components/CreateEventBurrowModal.tsx"
import { createBurrow } from "@features/burrows/create/create.api.ts"
import type { SubmittedBurrow } from "@features/burrows/create/create.types.ts"

/**
 * View user's burrow history.
 *
 * @author AJ Kneisl
 */
export default function History() {
    const nav = useNavigate()
    const [currentPage, setCurrentPage] = useState(1)
    const [recreateModal, setRecreateModal] = useState<{
        open: boolean
        burrow: BurrowResponse | null
    }>({ open: false, burrow: null })

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }, [currentPage])

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ["history", currentPage],
        queryFn: async () => await getUserHistory(currentPage),
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

    function handleRecreate(burrow: BurrowResponse) {
        setRecreateModal({ open: true, burrow })
    }

    function closeRecreateModal() {
        setRecreateModal({ open: false, burrow: null })
    }

    async function handleSubmitRecreate(payload: SubmittedBurrow) {
        const newBurrow = await createBurrow(payload)
        closeRecreateModal()
        nav(`/${newBurrow.id}`)
        return newBurrow
    }

    if (error)
        return (
            // error
            <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            </main>
        )

    return (
        <section className="mx-auto w-full max-w-4xl p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-text text-2xl font-bold">History</h1>

                <p className="text-text/60 text-sm">
                    View your Burrows and recreate past ones
                </p>
            </div>

            {isLoading && !data ? (
                // loading skeleton
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

            {!isLoading && isFetching ? (
                // loading
                <div className="mb-4 text-right">
                    <span className="border-info/30 bg-info/10 text-info inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating…
                    </span>
                </div>
            ) : null}

            {!isLoading && groupedByDate.length === 0 && (
                // empty history
                <div className="border-primary/20 bg-card text-text rounded-2xl border p-6 shadow-sm">
                    <p className="text-sm font-medium">
                        No Burrows in your history yet.
                    </p>
                    <p className="text-text/70 mt-1 text-xs">
                        Create a Burrow to get started!
                    </p>
                </div>
            )}

            {!isLoading && groupedByDate.length > 0 && (
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
                                                actionBadge={
                                                    m.burrow.kind !==
                                                        "PROJECT" &&
                                                    m.burrow.endTime <
                                                        Date.now() ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRecreate(
                                                                    m
                                                                )
                                                            }}
                                                            className="bg-secondary/10 text-secondary ring-secondary/30 hover:bg-secondary/20 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ring-inset"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                            Recreate
                                                        </button>
                                                    ) : undefined
                                                }
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

            {recreateModal.open && recreateModal.burrow && (
                // recreation modals
                <>
                    {recreateModal.burrow.burrow.kind === "STUDY" && (
                        <CreateStudyBurrowModal
                            open={recreateModal.open}
                            onClose={closeRecreateModal}
                            mode="update"
                            burrow={recreateModal.burrow.burrow}
                            modalTitle="Recreate Study Group"
                            onSubmit={handleSubmitRecreate}
                        />
                    )}

                    {recreateModal.burrow.burrow.kind === "EVENT" && (
                        <CreateEventBurrowModal
                            open={recreateModal.open}
                            onClose={closeRecreateModal}
                            mode="update"
                            meeting={recreateModal.burrow.burrow}
                            modalTitle="Recreate Event"
                            onSubmit={handleSubmitRecreate}
                        />
                    )}
                </>
            )}
        </section>
    )
}
