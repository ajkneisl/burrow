import BurrowModal from "./BurrowModal.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { createMeeting } from "@features/burrows/create/create.api.ts"

/**
 * The modal used to create a Burrow.
 */
export default function CreateBurrowModal({
    open,
    onClose,
    title = "Create a Study Burrow"
}: {
    open: boolean
    onClose: () => void
    title?: string
}) {
    const auth = useToken()

    return (
        <BurrowModal
            open={open}
            onClose={onClose}
            mode="create"
            modalTitle={title}
            onSubmit={async (payload) => {
                return await createMeeting(auth!, payload)
            }}
        />
    )
}
