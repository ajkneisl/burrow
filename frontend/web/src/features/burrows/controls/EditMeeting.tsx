import type { Burrow } from "@features/burrows/burrows.types.ts"
import EditBurrowModal from "@features/burrows/create/components/EditBurrowModal.tsx"
import { useMemo, useState } from "react"
import { Button } from "@umnburrow/core"

/**
 * {@link EditMeeting}
 */
type EditMeetingProps = {
    meeting: Burrow
}

/**
 * Button to edit a meeting.
 *
 * @param meeting The meeting to edit.
 *
 * @see EditBurrowModal
 */
export default function EditMeeting({ meeting }: EditMeetingProps) {
    const [open, setOpen] = useState(false)
    const inPast = useMemo(
        () => new Date().valueOf() > meeting.endTime,
        [meeting.endTime]
    )

    return (
        <>
            <EditBurrowModal
                open={open}
                onClose={() => setOpen(false)}
                meeting={meeting}
                title={`Edit: ${meeting.title}`}
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
