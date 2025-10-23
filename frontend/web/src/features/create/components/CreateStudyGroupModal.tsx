import { useAtom } from "jotai"
import { authToken } from "../../auth/api/auth.atom.ts"
import StudyGroupModal from "./StudyGroupModal.tsx"
import { createMeeting } from "@features/groups/api/groups.api.ts"

export default function CreateStudyGroupModal({
    open,
    onClose,
    title = "Create a Study Group"
}: {
    open: boolean
    onClose: () => void
    title?: string
}) {
    const [auth] = useAtom(authToken)

    return (
        <StudyGroupModal
            open={open}
            onClose={onClose}
            mode="create"
            modalTitle={title}
            onSubmit={async (payload) => {
                return await createMeeting(auth, payload)
            }}
        />
    )
}
