import { post } from "@api/api.ts"
import {
    USER_REPORT_CATEGORIES,
    type UserReportCategory
} from "@features/report/report.types.ts"
import { useMutation } from "@tanstack/react-query"
import { Button, Modal, SelectInput, TextArea } from "@umnburrow/core"
import { useState, type FormEvent } from "react"
import toast from "react-hot-toast"

/**
 * {@link ReportUserModal}
 */
type ReportUserModalProps = {
    open: boolean
    onClose: () => void
    userID: string
    username: string
}

/**
 * Report a user.
 *
 * @param open If the modal is open.
 * @param onClose To close the modal.
 * @param userID The ID of the user to report.
 * @param username The name of the user to report.
 * @constructor
 */
export default function ReportUserModal({
    open,
    onClose,
    userID,
    username
}: ReportUserModalProps) {
    const [category, setCategory] = useState<UserReportCategory>("Spam")
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
                reportType: "USER",
                summary: `User report: ${category}`,
                category,
                details,
                attachedID: userID
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
        <Modal open={open} onClose={handleClose} title="Report User">
            <form
                onSubmit={handleSubmit}
                className="min-w-xs space-y-4 md:min-w-md"
            >
                <p className="text-sm text-text/80">
                    Why are you reporting{" "}
                    <span className="font-semibold">{username}</span>?
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
                            ev.currentTarget.value as UserReportCategory
                        )
                    }
                    items={USER_REPORT_CATEGORIES}
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
                        color="SUCCESS"
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
