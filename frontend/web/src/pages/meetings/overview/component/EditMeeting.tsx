import type { GroupMeeting } from "@features/groups/api/groups.types.ts"
import EditStudyGroupModal from "@features/create/components/EditStudyGroupModal.tsx"
import { useMemo, useState } from "react"
import { Button } from "@umnburrow/core"

/**
 * {@link EditMeeting}
 */
type EditMeetingProps = {
    meeting: GroupMeeting
}

/**
 * Button to edit a meeting.
 *
 * @param meeting The meeting to edit.
 *
 * @see EditStudyGroupModal
 */
export default function EditMeeting({ meeting }: EditMeetingProps) {
    const [open, setOpen] = useState(false)
    const inPast = useMemo(
        () => new Date().valueOf() > meeting.endTime,
        [meeting.endTime]
    )

    return (
        <>
            <EditStudyGroupModal
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
