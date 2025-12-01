import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Button, Card, Input, SelectInput } from "@umnburrow/core"
import { getLogs } from "../features/logs/log.api.ts"
import LogEntry from "../features/logs/components/LogEntry.tsx"
import { adminTokenAtom } from "../features/auth/admin.atom.ts"

/**
 * View logs.
 */
export default function LogsView() {
    const [token] = useAtom(adminTokenAtom)
    const [page, setPage] = useState(1)
    const [levelFilter, setLevelFilter] = useState("")
    const [sourceFilter, setSourceFilter] = useState("")
    const [userIDFilter, setUserIDFilter] = useState("")

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: [
            "admin",
            "logs",
            page,
            levelFilter,
            sourceFilter,
            userIDFilter
        ],
        queryFn: () =>
            getLogs(
                token ?? "",
                page,
                levelFilter || undefined,
                sourceFilter || undefined,
                userIDFilter || undefined
            ),
        refetchOnWindowFocus: true
    })

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1)
        }
    }

    const handleNextPage = () => {
        if (data?.hasMore) {
            setPage(page + 1)
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                {/* title */}
                <h1 className="text-2xl font-bold">Logs</h1>

                {/* refresh button */}
                <div className="flex items-center gap-2">
                    <Button onClick={() => refetch()}>
                        {isFetching ? "Refreshing…" : "Refresh"}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col gap-3 p-4">
                    {/* filters */}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <SelectInput
                            className="col-span-1"
                            items={[
                                "All Levels",
                                "DEBUG",
                                "INFO",
                                "WARN",
                                "ERROR",
                                "FATAL"
                            ]}
                            onChange={(e) => {
                                const val = e.target.value
                                setLevelFilter(
                                    val === "All Levels" ? "" : val
                                )
                                setPage(1)
                            }}
                        />

                        <Input
                            className="col-span-1"
                            value={sourceFilter}
                            onChange={(e) => {
                                setSourceFilter(e.target.value)
                                setPage(1)
                            }}
                            placeholder="Filter by source…"
                        />

                        <Input
                            className="col-span-1"
                            value={userIDFilter}
                            onChange={(e) => {
                                setUserIDFilter(e.target.value)
                                setPage(1)
                            }}
                            placeholder="Filter by user ID…"
                        />
                    </div>

                    {/* pagination info */}
                    <div className="flex justify-center items-center text-xs text-text/70">
                        Page {page} • {data?.logs.length ?? 0} results
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-20 animate-pulse rounded-xl border border-primary/10 bg-primary/5"
                                />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm">
                            <div className="font-semibold text-error">
                                Failed to load logs
                            </div>
                            <div className="mt-1 text-muted-foreground">
                                {(error as Error)?.message || "Unknown error"}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-3 w-[728px]">
                                {data?.logs.map((log) => (
                                    <LogEntry key={log.id} log={log} />
                                ))}
                                {data?.logs.length === 0 && (
                                    <div className="rounded-xl border border-primary/10 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                                        No logs match your filters.
                                    </div>
                                )}
                            </div>

                            {/* pagination controls */}
                            {(page > 1 || data?.hasMore) && (
                                <div className="flex justify-center gap-2 mt-4">
                                    <Button
                                        onClick={handlePrevPage}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={handleNextPage}
                                        disabled={!data?.hasMore}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}