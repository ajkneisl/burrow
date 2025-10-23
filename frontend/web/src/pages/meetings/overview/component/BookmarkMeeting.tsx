import { useQueryClient } from "@tanstack/react-query"
import {
    createBookmark,
    deleteBookmark
} from "@features/groups/api/groups.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import MeetingButton from "@pages/meetings/components/MeetingButton.tsx"

type BookmarkMeetingProps = {
    isBookmarked: boolean
    meetingId: string
}

/**
 * Button to bookmark a meeting.
 *
 * @param isBookmarked If the meeting is bookmarked.
 * @param meetingId The ID of the meeting.
 * @constructor
 */
export default function BookmarkMeeting({
    isBookmarked,
    meetingId
}: BookmarkMeetingProps) {
    const queryClient = useQueryClient()
    const auth = useToken()

    async function bookmark() {
        if (auth === null) return

        queryClient.setQueryData(["meeting", meetingId], (old: any) => {
            if (!old) return old
            return { ...old, bookmarked: !old.bookmarked }
        })

        if (!isBookmarked) {
            await createBookmark(auth, meetingId)
        } else {
            await deleteBookmark(auth, meetingId)
        }
    }

    return (
        <MeetingButton
            onClick={bookmark}
            className={isBookmarked ? "text-secondary" : "text-text"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
            >
                <path d="M6.32 2.75A2.25 2.25 0 0 0 4.25 5v16a.75.75 0 0 0 1.2.6l6.33-4.75 6.33 4.75a.75.75 0 0 0 1.2-.6V5A2.25 2.25 0 0 0 17.68 2.75H6.32z" />
            </svg>
        </MeetingButton>
    )
}
