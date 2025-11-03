import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Button, Input, Modal, SelectInput, TextArea } from "@umnburrow/core"
import { useAtom } from "jotai"
import { problemModalOpen } from "@features/problem/problem.atom.ts"
import {
    type ReportCategory,
    submitReport
} from "@features/problem/problem.api.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import toast from "react-hot-toast"

/**
 * A modal to report a problem
 */
export default function ReportProblemModal() {
    const auth = useToken()

    const [open, setOpen] = useAtom(problemModalOpen)

    const [summary, setSummary] = useState("")
    const [details, setDetails] = useState("")
    const [category, setCategory] = useState<ReportCategory>("Bug")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Capture a stable snapshot of context so it doesn't change mid-submit
    const context = useMemo(
        () => ({
            path:
                typeof window !== "undefined"
                    ? window.location.pathname + window.location.search
                    : "",
            userAgent:
                typeof navigator !== "undefined" ? navigator.userAgent : ""
        }),
        []
    )

    useEffect(() => {
        if (!open) {
            // reset when modal closes
            setSummary("")
            setDetails("")
            setCategory("Bug")

            setLoading(false)
            setError(null)
        }
    }, [open])

    const canSubmit =
        summary.trim().length >= 6 && details.trim().length >= 10 && !loading

    async function handleSubmit(ev: FormEvent) {
        ev.preventDefault()
        if (!canSubmit || !auth) return

        setLoading(true)
        setError(null)

        try {
            const id = await submitReport(auth, {
                summary,
                details,
                category,
                burrowInfo: `${import.meta.env.VITE_VERSION} (${import.meta.env.VITE_BASE_URL || "Unknown"})`,
                path: context.path,
                userAgent: context.userAgent
            })

            toast.success(`Submitted report. ReportView ID: ${id}`)

            setOpen(false)
        } catch {
            setError("Could not send your report. Please try again.")
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="ReportView a problem"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="border-error/20 bg-error/5 text-error rounded-lg border px-3 py-2 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        className="col-span-1"
                        text="Brief summary"
                        placeholder="What's going wrong?"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        maxLength={120}
                        remark="At least 6 characters."
                        required
                    />

                    <SelectInput
                        className="col-span-1"
                        text={"Category"}
                        value={category}
                        onChange={(ev) =>
                            setCategory(
                                ev.currentTarget.value as ReportCategory
                            )
                        }
                        items={[
                            "Bug",
                            "Content",
                            "Performance",
                            "Accessibility",
                            "Other"
                        ]}
                    />
                </div>

                <TextArea
                    text={"Describe your issue"}
                    placeholder="Steps to reproduce, what you expected, and what happened instead."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    remark={
                        "At least 10 characters. We automatically include Burrow information, the page, and your browser info."
                    }
                    required
                />

                {/* Context preview */}
                <div className="border-card-border bg-card text-text/70 rounded-lg border px-3 py-2 text-xs">
                    <div>
                        <span className="font-medium">Version:</span>{" "}
                        {import.meta.env.VITE_VERSION} (
                        {import.meta.env.VITE_BASE_URL || "Unknown"})
                    </div>

                    <div>
                        <span className="font-medium">Page:</span>{" "}
                        {context.path || "/"}
                    </div>

                    <div className="mt-1 line-clamp-2 break-words">
                        <span className="font-medium">Browser:</span>{" "}
                        {context.userAgent || "Unknown"}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        color="ERROR"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        color="SUCCESS"
                        loading={loading}
                        disabled={!canSubmit}
                    >
                        Send ReportView
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
