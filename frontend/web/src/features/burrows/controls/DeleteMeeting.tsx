import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import { useRef } from "react"
import { deleteMeeting } from "@features/burrows/burrows.api.ts"
import { useNavigate } from "react-router"
import useToken from "@features/auth/hooks/useToken.ts"
import { Button } from "@umnburrow/core"

/**
 * {@link DeleteMeeting}
 */
type DeleteMeetingProps = {
    meeting: Burrow
}

/**
 * The button, and following confirmation, to delete a meeting.
 *
 * @param meeting The meeting to delete.
 */
export default function DeleteMeeting({ meeting }: DeleteMeetingProps) {
    const auth = useToken()
    const nav = useNavigate()
    const confirmToastIdRef = useRef<string | null>(null)

    // actually delete it :(
    const performDelete = async () => {
        const loadingId = toast.loading("Deleting meeting…")

        if (auth === null) return

        try {
            await deleteMeeting(auth, meeting.id)
            toast.success("Meeting deleted")
            nav("/")
        } catch {
            toast.error("Failed to delete meeting")
        } finally {
            toast.dismiss(loadingId)
        }
    }

    const confirmDelete = () => {
        if (confirmToastIdRef.current) {
            toast.dismiss(confirmToastIdRef.current)
            confirmToastIdRef.current = null
        }

        const id = toast.custom(
            (toastObj) => (
                <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={
                        toastObj.visible
                            ? { opacity: 1, y: 0, scale: 1 }
                            : { opacity: 0, y: -12, scale: 0.98 }
                    }
                    transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                        mass: 0.2
                    }}
                    className="max-w-sm rounded-xl border border-primary/20 bg-card p-6 shadow-lg"
                >
                    <div className="p-4">
                        <p className="text-sm font-medium text-text">
                            Delete this meeting?
                        </p>

                        <p className="mt-1 text-xs text-text/70">
                            This action cannot be undone.
                        </p>
                    </div>

                    <div className="mt-3 flex justify-evenly gap-2">
                        <Button
                            onClick={() => {
                                toast.dismiss(toastObj.id)
                                confirmToastIdRef.current = null
                            }}
                            color="SECONDARY"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={() => {
                                toast.dismiss(toastObj.id)
                                confirmToastIdRef.current = null
                                performDelete()
                            }}
                            color={"ERROR"}
                        >
                            Delete
                        </Button>
                    </div>
                </motion.div>
            ),
            { duration: 3000, position: "top-center" }
        )

        confirmToastIdRef.current = id as string
    }

    return (
        <Button onClick={() => confirmDelete()} color="ERROR">
            Delete
        </Button>
    )
}
