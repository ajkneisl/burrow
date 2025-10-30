import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Button, Card, Input, SelectInput } from "@umnburrow/core"
import { getReports } from "../features/reports/report.api.ts"
import ReportView from "../features/reports/component/ReportView.tsx"
import { adminTokenAtom } from "../features/auth/admin.atom.ts"

/**
 * View reports.
 */
export default function ReportsView() {
    const [token] = useAtom(adminTokenAtom)
    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["admin", "reports"],
        queryFn: () => getReports(token ?? ""),
        refetchOnWindowFocus: true
    })

    const [q, setQ] = useState("")
    const [cat, setCat] = useState("all")

    const { items, categories } = useMemo(() => {
        const list = (data ?? [])
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
        const cats = Array.from(new Set(list.map((r) => r.category))).sort()
        const query = q.trim().toLowerCase()
        const filtered = list.filter((r) => {
            const inCat = cat === "all" || r.category === cat
            if (!inCat) return false
            if (!query) return true
            const hay =
                `${r.summary}\n${r.details}\n${r.path}\n${r.userAgent}\n${r.userId}`.toLowerCase()
            return hay.includes(query)
        })

        return { items: filtered, categories: cats }
    }, [data, q, cat])

    return (
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                {/* title */}
                <h1 className="text-2xl font-bold">Reports</h1>

                {/* refresh button */}
                <div className="flex items-center gap-2">
                    <Button onClick={() => refetch()}>
                        {isFetching ? "Refreshing…" : "Refresh"}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col gap-3 p-4">
                    {/* search input */}
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            className="col-span-1"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search summary, details, path, user…"
                        />

                        <SelectInput
                            className="col-span-1"
                            items={["All Categories", ...categories]}
                            onChange={(e) => setCat(e.target.value)}
                        />
                    </div>

                    {/* results count */}
                    <div className="flex justify-center items-center text-xs text-text/70">
                        {items.length} / {data?.length ?? 0} results
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
                                Failed to load reports
                            </div>
                            <div className="mt-1 text-muted-foreground">
                                {(error as Error)?.message || "Unknown error"}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 w-[728px]">
                            {items.map((report) => (
                                <ReportView key={report.id} report={report} />
                            ))}
                            {items.length === 0 && (
                                <div className="rounded-xl border border-primary/10 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                                    No reports match your filters.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
