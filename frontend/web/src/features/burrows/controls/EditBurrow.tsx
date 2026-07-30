import { updateBurrow } from "@umnburrow/core/api"
import type { Burrow } from "@umnburrow/core/api"
import { useMemo, useState } from "react"
import { Button } from "@umnburrow/core"
import CreateStudyBurrowModal from "@features/burrows/create/components/CreateStudyBurrowModal.tsx"
import CreateProjectBurrowModal from "@features/burrows/create/components/project/CreateProjectBurrowModal.tsx"

/**
 * {@link EditBurrow}
 */
type EditBurrowProps = {
    burrow: Burrow
}

/**
 * Button to edit a meeting.
 *
 * @param meeting The Burrow to edit.
 *
 * @author AJ Kneisl
 */
export default function EditBurrow({ burrow }: EditBurrowProps) {
    const [open, setOpen] = useState(false)
    const inPast = useMemo(
        () => new Date().valueOf() > burrow.endTime,
        [burrow.endTime]
    )

    const modalElement =
        burrow.kind === "PROJECT" ? (
            <CreateProjectBurrowModal
                open={open}
                onClose={() => setOpen(false)}
                mode="update"
                meeting={burrow}
                modalTitle={`Edit: ${burrow.title}`}
                onSubmit={async (payload) => {
                    return await updateBurrow(burrow.id, payload)
                }}
            />
        ) : (
            <CreateStudyBurrowModal
                open={open}
                onClose={() => setOpen(false)}
                mode="update"
                burrow={burrow}
                modalTitle={`Edit: ${burrow.title}`}
                onSubmit={async (payload) => {
                    return await updateBurrow(burrow.id, payload)
                }}
            />
        )

    return (
        <>
            {modalElement}

            <Button
                onClick={() => setOpen(true)}
                color={"SECONDARY"}
                disabled={inPast}
            >
                Edit
            </Button>
        </>
    )
}
