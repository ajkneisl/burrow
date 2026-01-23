import { Button, Modal } from "@umnburrow/core"
import { put } from "@api/api.ts"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useState } from "react"
import { useNavigate } from "react-router"

/**
 * {@link BlockUserModal}
 */
type BlockUserModalProps = {
    open: boolean
    handleClose: () => void
    userID: string
    username: string
}

/**
 * Modal to block a user.
 *
 * @param open If the modal is opened.
 * @param onClose When the modal is closed.
 * @param userID The ID of the user to block.
 * @param username The username of the user to block.
 *
 * @author AJ Kneisl
 */
export default function BlockUserModal({
    open,
    handleClose,
    userID,
    username
}: BlockUserModalProps) {
    const nav = useNavigate()
    const [error, setError] = useState<string | null>(null)

    const blockMutation = useMutation({
        mutationFn: async () => {
            return put("/user/block", undefined, { query: { userID } })
        },

        onSuccess: () => {
            toast.success("User has been successfully blocked.")
            handleClose()
            nav("/")
        },

        onError: (err: Error) => {
            setError(err?.message || "Failed to block user. Please try again.")
        }
    })

    return (
        <Modal open={open} onClose={handleClose} title="Confirm Block">
            <div className="space-y-4">
                <p className="text-text/80 text-sm">
                    Are you sure you want to block{" "}
                    <span className="font-semibold">{username}</span>?
                </p>

                {error && (
                    <div className="border-error/20 bg-error/5 text-error rounded-lg border px-3 py-2 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                        type="button"
                        color="ERROR"
                        onClick={handleClose}
                        disabled={blockMutation.isPending}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        color="SUCCESS"
                        onClick={() => blockMutation.mutate()}
                        loading={blockMutation.isPending}
                    >
                        Confirm
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
