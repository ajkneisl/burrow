import type { GroupMeeting } from "@features/groups/api/groups.types.ts"
import EditStudyGroupModal from "@features/create/components/EditStudyGroupModal.tsx"
import { useState } from "react"
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
            >
                Edit
            </Button>
        </>
    )
}
