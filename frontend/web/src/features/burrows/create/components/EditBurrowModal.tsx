import type { Burrow } from "@features/burrows/burrows.types.ts"
import BurrowModal from "./BurrowModal.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { updateMeeting } from "@features/burrows/create/create.api.ts"

/**
 * Edit a Burrow modal.
 */
export default function EditBurrowModal({
    open,
    onClose,
    meeting,
    title = "Update your Burrow"
}: {
    open: boolean
    onClose: () => void
    meeting: Burrow
    title?: string
}) {
    const auth = useToken()

    return (
        <BurrowModal
            open={open}
            onClose={onClose}
            mode="update"
            meeting={meeting}
            modalTitle={title}
            onSubmit={async (payload) => {
                return await updateMeeting(auth!, meeting.id, payload)
            }}
        />
    )
}
