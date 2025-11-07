import { useAtom } from "jotai"
import { authToken } from "../../auth/auth.atom.ts"
import type { Burrow } from "@features/burrows/burrows.types.ts"
import StudyGroupModal from "./StudyGroupModal.tsx"
import { updateMeeting } from "@features/burrows/burrows.api.ts"

export default function EditStudyGroupModal({
    open,
    onClose,
    meeting,
    title = "Update Study Group"
}: {
    open: boolean
    onClose: () => void
    meeting: Burrow
    title?: string
}) {
    const [auth] = useAtom(authToken)

    return (
        <StudyGroupModal
            open={open}
            onClose={onClose}
            mode="update"
            meeting={meeting}
            modalTitle={title}
            onSubmit={async (payload) => {
                console.log("waddup")
                return await updateMeeting(auth, meeting.id, payload)
            }}
        />
    )
}
