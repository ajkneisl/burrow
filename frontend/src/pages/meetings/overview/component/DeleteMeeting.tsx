import type { GroupMeeting } from "@features/groups/api/groups.types.ts"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import { useRef } from "react"
import { deleteMeeting } from "@features/groups/api/groups.api.ts"
import { useNavigate } from "react-router"
import useToken from "@features/auth/api/hooks/useToken.ts"
import Button from "@components/Button.tsx"

/**
 * {@link DeleteMeeting}
 */
type DeleteMeetingProps = {
    meeting: GroupMeeting
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
                    className="max-w-sm rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                >
                    <p className="text-sm font-medium text-gray-900">
                        Delete this meeting?
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                        This action cannot be undone.
                    </p>

                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            onClick={() => {
                                toast.dismiss(toastObj.id)
                                confirmToastIdRef.current = null
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={() => {
                                toast.dismiss(toastObj.id)
                                confirmToastIdRef.current = null
                                performDelete()
                            }}
                            className="hover:cursor-pointer rounded-lg border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200"
                        >
                            Delete
                        </button>
                    </div>
                </motion.div>
            ),
            { duration: 3000, position: "top-center" }
        )
        confirmToastIdRef.current = id as string
    }

    return (
        <Button
            onClick={confirmDelete}
            colors="text-text border border-error/50 bg-error/60"
        >
            Delete
        </Button>
    )
}
