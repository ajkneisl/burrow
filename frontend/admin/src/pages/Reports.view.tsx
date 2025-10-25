import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { BASE_URL } from "../admin.api.ts"
import { adminTokenAtom } from "./Login.view.tsx"
import { Card } from "@umnburrow/core"

// -------------------- Types --------------------
export type AdminReport = {
    id: string // UUID
    userId: string
    summary: string
    details: string
    category: string
    path: string
    userAgent: string
    burrowInfo: string
    createdAt: number // epoch millis
}

async function fetchReports(token?: string): Promise<AdminReport[]> {
    const res = await fetch(`${BASE_URL}/admin/reports`, {
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

// -------------------- Utils --------------------
function timeAgo(ms: number): string {
    const diff = Date.now() - ms
    const s = Math.max(1, Math.floor(diff / 1000))
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d ago`
    const date = new Date(ms)
    return date.toLocaleString()
}

function ClipboardButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            className="rounded border border-primary/20 bg-primary/5 px-2 py-1 text-xs hover:border-primary hover:bg-primary/10"
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1200)
                } catch {}
            }}
            title="Copy to clipboard"
        >
            {copied ? "Copied" : (label ?? "Copy")}
        </button>
    )
}

function Row({ r }: { r: AdminReport }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="rounded-xl border border-primary/15 bg-card">
            <button
                className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-primary/5"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                            {r.summary || "(no summary)"}
                        </span>
                        <span className="rounded bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
                            {r.category}
                        </span>
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {r.path}
                    </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(r.createdAt)}
                </div>
            </button>
            {open && (
                <div className="border-t border-primary/10 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Details
                                </div>
                                <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                                    {r.details}
                                </pre>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>ID:</span>
                                <code className="rounded bg-muted/40 px-1.5 py-0.5">
                                    {r.id}
                                </code>
                                <ClipboardButton text={r.id} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Meta
                                </div>
                                <div className="mt-1 rounded-lg border border-primary/10 bg-card p-3 text-xs">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-muted-foreground">
                                            User
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {r.userId}
                                        </div>
                                        <div className="text-muted-foreground">
                                            Path
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {r.path}
                                        </div>
                                        <div className="text-muted-foreground">
                                            Burrow
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {r.burrowInfo}
                                        </div>
                                        <div className="text-muted-foreground">
                                            User-Agent
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {r.userAgent}
                                        </div>
                                        <div className="text-muted-foreground">
                                            Created
                                        </div>
                                        <div className="col-span-2">
                                            {new Date(
                                                r.createdAt
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <ClipboardButton
                                    label="Copy UA"
                                    text={r.userAgent}
                                />
                                <ClipboardButton
                                    label="Copy Path"
                                    text={r.path}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ReportsView() {
    const [token] = useAtom(adminTokenAtom)
    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["admin", "reports"],
        queryFn: () => fetchReports(token ?? undefined),
        refetchOnWindowFocus: true
    })

    // Search & category filter
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
                <h1 className="text-2xl font-bold">Reports</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="rounded-lg border border-primary/30 bg-card px-3 py-2 text-sm font-medium hover:border-primary hover:bg-primary/5"
                    >
                        {isFetching ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col gap-3 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search summary, details, path, user…"
                            className="w-full rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
                        />
                        <select
                            value={cat}
                            onChange={(e) => setCat(e.target.value)}
                            className="w-full rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm focus:border-primary"
                        >
                            <option value="all">All categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center text-xs text-muted-foreground">
                            {items.length} / {data?.length ?? 0} results
                        </div>
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
                        <div className="grid grid-cols-1 gap-3">
                            {items.map((r) => (
                                <Row key={r.id} r={r} />
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
