import { useState, type FormEvent } from "react"
import { post } from "@api/api.ts"
import {
    BURROW_REPORT_CATEGORIES,
    type BurrowReportCategory
} from "@features/report/report.types.ts"
import { Button, TextArea, SelectInput, Modal } from "@umnburrow/core"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"

/**
 * {@link ReportBurrowModal}
 */
type ReportBurrowModalProps = {
    open: boolean
    onClose: () => void
    burrowID: string
    burrowTitle: string
}

/**
 * A modal to report a Burrow.
 *
 * @param open If the modal is open.
 * @param onClose When the modal is closed.
 * @param burrowID The ID of the Burrow to report.
 * @param burrowTitle The title of the Burrow to report.
 *
 * @author AJ Kneisl
 */
export default function ReportBurrowModal({
    open,
    onClose,
    burrowID,
    burrowTitle
}: ReportBurrowModalProps) {
    const [category, setCategory] = useState<BurrowReportCategory>("Spam")
    const [details, setDetails] = useState("")
    const [error, setError] = useState<string | null>(null)

    const resetState = () => {
        setCategory("Spam")
        setDetails("")
        setError(null)
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const reportMutation = useMutation({
        mutationFn: async () => {
            return post("/report", {
                reportType: "BURROW",
                summary: `Burrow report: ${category}`,
                category,
                details,
                attachedID: burrowID
            })
        },

        onSuccess: () => {
            toast.success("Report submitted. Thank you for your feedback.")
            handleClose()
        },

        onError: (err: Error) => {
            setError(
                err?.message || "Failed to submit report. Please try again."
            )
        }
    })

    const canSubmit = details.trim().length >= 10 && !reportMutation.isPending

    function handleSubmit(ev: FormEvent) {
        ev.preventDefault()
        if (!canSubmit) return
        reportMutation.mutate()
    }

    return (
        <Modal open={open} onClose={handleClose} title="Report Burrow">
            <form
                onSubmit={handleSubmit}
                className="min-w-xs space-y-4 md:min-w-md"
            >
                <p className="text-sm text-text/80">
                    Why are you reporting{" "}
                    <span className="font-semibold">{burrowTitle}</span>?
                </p>

                {error && (
                    <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
                        {error}
                    </div>
                )}

                <SelectInput
                    text="Category"
                    value={category}
                    onChange={(ev) =>
                        setCategory(
                            ev.currentTarget.value as BurrowReportCategory
                        )
                    }
                    items={BURROW_REPORT_CATEGORIES}
                />

                <TextArea
                    className="max-h-64 min-h-25 w-full resize-y"
                    text="Details"
                    placeholder="Please describe the issue in detail..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    remark="At least 10 characters required."
                    required
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        color="ERROR"
                        onClick={handleClose}
                        disabled={reportMutation.isPending}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        color="WARNING"
                        loading={reportMutation.isPending}
                        disabled={!canSubmit}
                    >
                        Report
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
