import { createBookmark, deleteBookmark } from "@umnburrow/core/api"
import { useQueryClient } from "@tanstack/react-query"
import useToken from "@features/auth/hooks/useToken.ts"
import MeetingButton from "@features/burrows/controls/MeetingButton.tsx"
import { Bookmark } from "lucide-react"

/**
 * {@see BookmarkMeeting}
 */
type BookmarkMeetingProps = {
    isBookmarked: boolean
    inPast: boolean
    meetingId: string
}

/**
 * Button to bookmark a meeting.
 *
 * @param isBookmarked If the meeting is bookmarked.
 * @param inPast If the meeting is in the past.
 * @param meetingId The ID of the meeting.
 * @constructor
 */
export default function BookmarkMeeting({
    isBookmarked,
    inPast,
    meetingId
}: BookmarkMeetingProps) {
    const queryClient = useQueryClient()
    const auth = useToken()

    async function bookmark() {
        if (auth === null) return

        queryClient.setQueryData(["burrow", meetingId], (old: any) => {
            if (!old) return old
            return { ...old, bookmarked: !old.bookmarked }
        })

        if (!isBookmarked) {
            await createBookmark(meetingId)
        } else {
            await deleteBookmark(meetingId)
        }
    }

    return (
        <MeetingButton
            onClick={bookmark}
            disabled={inPast}
            className={isBookmarked ? "text-secondary" : "text-text"}
        >
            <Bookmark
                className="size-5"
                fill={isBookmarked ? "currentColor" : "none"}
            />
        </MeetingButton>
    )
}
