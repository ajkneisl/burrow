import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "react-hot-toast"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { deleteMeeting } from "@features/burrows/burrows.api.ts"
import { Button, Modal } from "@umnburrow/core"

/**
 * {@link DeleteBurrow}
 */
type DeleteMeetingProps = {
    burrow: Burrow
}

/**
 * The button, and following confirmation, to delete a meeting.
 *
 * @param burrow The meeting to delete.
 */
export default function DeleteBurrow({ burrow }: DeleteMeetingProps) {
    const nav = useNavigate()
    const [open, setOpen] = useState(false)

    const performDelete = async () => {
        setOpen(false)
        const loadingID = toast.loading("Deleting meeting…")

        try {
            await deleteMeeting(burrow.id)
            toast.success("Meeting deleted")
            nav("/")
        } catch {
            toast.error("Failed to delete meeting")
        } finally {
            toast.dismiss(loadingID)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} color="ERROR">
                Delete
            </Button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Delete Meeting"
            >
                <p className="text-sm font-medium text-text">
                    Are you sure you want to delete this meeting?
                </p>

                <p className="mt-1 text-xs text-text/70">
                    This action cannot be undone.
                </p>

                <div className="mt-4 flex justify-end gap-2">
                    <Button onClick={() => setOpen(false)} color="SECONDARY">
                        Cancel
                    </Button>

                    <Button onClick={performDelete} color="ERROR">
                        Delete
                    </Button>
                </div>
            </Modal>
        </>
    )
}