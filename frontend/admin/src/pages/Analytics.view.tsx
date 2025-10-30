import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Card } from "@umnburrow/core"
import { fetchAnalytics } from "../features/analytics/analytics.api.ts"
import Statistic from "../features/analytics/components/Statistic.tsx"
import { adminTokenAtom } from "../features/auth/admin.atom.ts"

/**
 * View analytics.
 */
export default function AnalyticsView() {
    const [token] = useAtom(adminTokenAtom)
    const qc = useQueryClient()

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["admin", "analytics"],
        queryFn: () => fetchAnalytics(token ?? undefined),
        refetchOnWindowFocus: true
    })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() =>
                            qc.invalidateQueries({
                                queryKey: ["admin", "analytics"]
                            })
                        }
                        className="rounded-lg border border-primary/30 bg-card px-3 py-2 text-sm font-medium hover:border-primary hover:bg-primary/5"
                        aria-label="Refresh analytics"
                    >
                        {isFetching ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <Card className="animate-pulse">
                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-primary/10 bg-card p-4"
                            >
                                <div className="mb-3 h-3 w-24 rounded bg-primary/10" />
                                <div className="h-8 w-20 rounded bg-primary/20" />
                            </div>
                        ))}
                    </div>
                </Card>
            ) : isError ? (
                <Card>
                    <div className="flex items-start justify-between p-4">
                        <div>
                            <div className="text-lg font-semibold text-error">
                                Failed to load analytics
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {(error as Error)?.message || "Unknown error"}
                            </div>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm font-medium hover:border-error hover:bg-error/20"
                        >
                            Retry
                        </button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <Statistic
                        label="Users"
                        value={data!.userCount.toLocaleString()}
                        accent="secondary"
                    />

                    <Statistic
                        label="Active Users"
                        value={data!.activeUserCount.toLocaleString()}
                        accent="success"
                        sublabel={`${Math.round((data!.activeUserCount / Math.max(1, data!.userCount)) * 100)}% active`}
                    />

                    <Statistic
                        label="Meetings"
                        value={data!.meetingCount.toLocaleString()}
                        accent="info"
                    />

                    <Statistic
                        label="Active Meetings"
                        value={data!.activeMeetingCount.toLocaleString()}
                        accent="warn"
                        sublabel={`${Math.round((Number(data!.activeMeetingCount) / Math.max(1, Number(data!.meetingCount))) * 100)}% active`}
                    />
                </div>
            )}
        </div>
    )
}
