import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { useMemo, useState } from "react"
import { Button } from "@umnburrow/core"
import { updateBurrow } from "@features/burrows/create/create.api.ts"
import CreateStudyBurrowModal from "@features/burrows/create/components/study/CreateStudyBurrowModal.tsx"

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

    return (
        <>
            <CreateStudyBurrowModal
                open={open}
                onClose={() => setOpen(false)}
                mode="update"
                meeting={burrow}
                modalTitle={`Edit: ${burrow.title}`}
                onSubmit={async (payload) => {
                    return await updateBurrow(burrow.id, payload)
                }}
            />

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
