import type { LogEntry as LogEntryType } from "../log.models.ts"
import { useState } from "react"
import ClipboardButton from "../../../components/ClipboardButton.tsx"

type LogEntryProps = {
    log: LogEntryType
}

const LEVEL_COLORS: Record<string, string> = {
    DEBUG: "bg-muted/40 text-muted-foreground",
    INFO: "bg-info/10 text-info",
    WARN: "bg-warning/10 text-warning",
    ERROR: "bg-error/10 text-error",
    FATAL: "bg-error/20 text-error"
}

export default function LogEntry({ log }: LogEntryProps) {
    const [open, setOpen] = useState(false)
    const levelColor = LEVEL_COLORS[log.level] || LEVEL_COLORS.INFO

    return (
        <div className="rounded-xl border border-card-border bg-card">
            <button
                className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-primary/15"
                onClick={() => setOpen((v) => !v)}
                type="button"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${levelColor}`}
                        >
                            {log.level}
                        </span>

                        {log.source && (
                            <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
                                {log.source}
                            </span>
                        )}

                        {log.userID && (
                            <span className="text-[10px] text-muted-foreground">
                                User: {log.userID.substring(0, 8)}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 line-clamp-2 text-sm">
                        {log.message}
                    </div>
                </div>

                <div className="shrink-0 text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                </div>
            </button>

            {open && (
                <div className="border-t border-card-border p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Message
                                </div>
                                <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                                    {log.message}
                                </pre>
                            </div>

                            {log.stackTrace && (
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Stack Trace
                                    </div>
                                    <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed font-mono">
                                        {log.stackTrace}
                                    </pre>
                                    <div className="mt-2">
                                        <ClipboardButton
                                            label="Copy Stack Trace"
                                            text={log.stackTrace}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>ID:</span>
                                <code className="rounded bg-muted/40 px-1.5 py-0.5">
                                    {log.id}
                                </code>
                                <ClipboardButton text={log.id} />
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
                                            Level
                                        </div>
                                        <div className="col-span-2">
                                            {log.level}
                                        </div>

                                        {log.source && (
                                            <>
                                                <div className="text-muted-foreground">
                                                    Source
                                                </div>
                                                <div className="col-span-2 truncate">
                                                    {log.source}
                                                </div>
                                            </>
                                        )}

                                        {log.userID && (
                                            <>
                                                <div className="text-muted-foreground">
                                                    User ID
                                                </div>
                                                <div className="col-span-2 truncate">
                                                    {log.userID}
                                                </div>
                                            </>
                                        )}

                                        {log.exceptionClass && (
                                            <>
                                                <div className="text-muted-foreground">
                                                    Exception
                                                </div>
                                                <div className="col-span-2 truncate">
                                                    {log.exceptionClass}
                                                </div>
                                            </>
                                        )}

                                        <div className="text-muted-foreground">
                                            Timestamp
                                        </div>
                                        <div className="col-span-2">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {log.metadata && (
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Metadata
                                    </div>
                                    <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                                        {log.metadata}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}