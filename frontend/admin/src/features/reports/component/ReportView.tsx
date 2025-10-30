import type { Report } from "../report.models.ts"
import { useState } from "react"
import { timeAgo } from "../../../utils.ts"
import ClipboardButton from "../../../components/ClipboardButton.tsx"

type ReportViewProps = {
    report: Report
}

export default function ReportView({ report }: ReportViewProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="rounded-xl border border-card-border     bg-card">
            <button
                className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-primary/15"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                            {report.summary || "(no summary)"}
                        </span>

                        <span className="rounded bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
                            {report.category}
                        </span>
                    </div>

                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {report.path}
                    </div>
                </div>

                <div className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(report.createdAt)}
                </div>
            </button>

            {open && (
                <div className="border-t border-card-border p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Details
                                </div>
                                <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                                    {report.details}
                                </pre>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>ID:</span>
                                <code className="rounded bg-muted/40 px-1.5 py-0.5">
                                    {report.id}
                                </code>

                                <ClipboardButton text={report.id} />
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
                                            {report.userId}
                                        </div>

                                        <div className="text-muted-foreground">
                                            Path
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {report.path}
                                        </div>

                                        <div className="text-muted-foreground">
                                            Burrow
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {report.burrowInfo}
                                        </div>

                                        <div className="text-muted-foreground">
                                            User-Agent
                                        </div>
                                        <div className="col-span-2 truncate">
                                            {report.userAgent}
                                        </div>

                                        <div className="text-muted-foreground">
                                            Created
                                        </div>
                                        <div className="col-span-2">
                                            {new Date(
                                                report.createdAt
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <ClipboardButton
                                    label="Copy UA"
                                    text={report.userAgent}
                                />

                                <ClipboardButton
                                    label="Copy Path"
                                    text={report.path}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
