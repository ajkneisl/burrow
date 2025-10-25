import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { adminTokenAtom } from "./Login.view.tsx"
import { Card } from "@umnburrow/core"
import { BASE_URL } from "../admin.api.ts"

// API response shape
export type AnalyticsResponse = {
    userCount: number
    activeUserCount: number
    meetingCount: number
    activeMeetingCount: number
}

async function fetchAnalytics(token?: string): Promise<AnalyticsResponse> {
    const res = await fetch(`${BASE_URL}/admin/analytics`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include"
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}

function Stat({
    label,
    value,
    accent,
    sublabel
}: {
    label: string
    value: string | number
    accent?: "primary" | "info" | "success" | "warn" | "error"
    sublabel?: string
}) {
    const accentCls = accent ? `text-${accent}` : ""
    return (
        <div className="flex flex-col gap-1 p-4">
            <div className="text-sm/5 text-muted-foreground">{label}</div>
            <div
                className={`text-3xl font-semibold tracking-tight ${accentCls}`}
            >
                {value}
            </div>
            {sublabel && (
                <div className="text-xs/5 text-muted-foreground">
                    {sublabel}
                </div>
            )}
        </div>
    )
}

function Divider() {
    return <div className="h-px w-full bg-primary/10" />
}

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
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                        <Card className="border border-primary/20">
                            <Stat
                                label="Users"
                                value={data!.userCount.toLocaleString()}
                                accent="primary"
                                sublabel={`${data!.activeUserCount.toLocaleString()} active`}
                            />
                            <Divider />
                            <div className="p-4 text-xs text-muted-foreground">
                                Active / Total: {data!.activeUserCount} /{" "}
                                {data!.userCount}
                            </div>
                        </Card>

                        <Card className="border border-success/20">
                            <Stat
                                label="Active Users"
                                value={data!.activeUserCount.toLocaleString()}
                                accent="success"
                                sublabel={`${Math.round((data!.activeUserCount / Math.max(1, data!.userCount)) * 100)}% active`}
                            />
                            <Divider />
                            <div className="p-4 text-xs text-muted-foreground">
                                Percent active today
                            </div>
                        </Card>

                        <Card className="border border-info/20">
                            <Stat
                                label="Meetings"
                                value={data!.meetingCount.toLocaleString()}
                                accent="info"
                                sublabel={`${data!.activeMeetingCount.toLocaleString()} active`}
                            />
                            <Divider />
                            <div className="p-4 text-xs text-muted-foreground">
                                Active / Total: {data!.activeMeetingCount} /{" "}
                                {data!.meetingCount}
                            </div>
                        </Card>

                        <Card className="border border-warn/20">
                            <Stat
                                label="Active Meetings"
                                value={data!.activeMeetingCount.toLocaleString()}
                                accent="warn"
                                sublabel={`${Math.round((Number(data!.activeMeetingCount) / Math.max(1, Number(data!.meetingCount))) * 100)}% active`}
                            />
                            <Divider />
                            <div className="p-4 text-xs text-muted-foreground">
                                Percent currently active
                            </div>
                        </Card>
                    </div>

                    {/* Details */}
                    <Card className="border border-primary/20">
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <div className="text-base font-semibold">
                                    System snapshot
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    A quick overview of usage and activity
                                    across Burrow.
                                </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                Last updated just now
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 border-t border-primary/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border border-primary/10 bg-card p-3">
                                <div className="text-xs text-muted-foreground">
                                    User activity ratio
                                </div>
                                <div className="mt-1 text-lg font-semibold">
                                    {Math.round(
                                        (data!.activeUserCount /
                                            Math.max(1, data!.userCount)) *
                                            100
                                    )}
                                    %
                                </div>
                            </div>
                            <div className="rounded-lg border border-primary/10 bg-card p-3">
                                <div className="text-xs text-muted-foreground">
                                    Meeting activity ratio
                                </div>
                                <div className="mt-1 text-lg font-semibold">
                                    {Math.round(
                                        (Number(data!.activeMeetingCount) /
                                            Math.max(
                                                1,
                                                Number(data!.meetingCount)
                                            )) *
                                            100
                                    )}
                                    %
                                </div>
                            </div>
                            <div className="rounded-lg border border-primary/10 bg-card p-3">
                                <div className="text-xs text-muted-foreground">
                                    Users total
                                </div>
                                <div className="mt-1 text-lg font-semibold">
                                    {data!.userCount.toLocaleString()}
                                </div>
                            </div>
                            <div className="rounded-lg border border-primary/10 bg-card p-3">
                                <div className="text-xs text-muted-foreground">
                                    Meetings total
                                </div>
                                <div className="mt-1 text-lg font-semibold">
                                    {data!.meetingCount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </Card>
                </>
            )}
        </div>
    )
}
