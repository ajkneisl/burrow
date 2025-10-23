import type {
    GroupMeetingResponse,
    MeetingMemberStatus
} from "@features/groups/api/groups.types.ts"
import { toast } from "react-hot-toast"
import { joinMeeting, leaveMeeting } from "@features/groups/api/groups.api.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import { useQueryClient } from "@tanstack/react-query"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { Button } from "burrow-core"

type JoinMeetingProps = {
    data: GroupMeetingResponse
}

/**
 * Join a meeting.
 * @param data The
 * @constructor
 */
export default function JoinMeeting({ data }: JoinMeetingProps) {
    const user = useUser()
    const auth = useToken()

    const queryClient = useQueryClient()

    const setMembershipStatus = (status: MeetingMemberStatus) => {
        queryClient.setQueryData(["meeting", data.meeting.id], (old: any) => {
            if (!old) return old

            return {
                ...old,
                meeting: {
                    ...(old.meeting ?? {}),
                    joined:
                        status === "JOINED"
                            ? old.meeting.joined + 1
                            : old.meeting.joined - 1
                },
                membership: {
                    ...(old.membership ?? {}),
                    status
                }
            }
        })
    }

    async function joinLeaveButton() {
        if (auth === null) return

        if (data?.meeting?.owner === user?.id) {
            toast.error("You cannot leave your own meeting!")
            return
        }

        if (data?.membership?.status === "JOINED") {
            setMembershipStatus("LEFT")
            await leaveMeeting(auth, data.meeting.id)
        } else {
            setMembershipStatus("JOINED")
            await joinMeeting(auth, data?.meeting?.id ?? "")
        }
    }

    return (
        <Button
            onClick={joinLeaveButton}
            disabled={auth === null}
            color={data?.membership?.status === "JOINED" ? "ERROR" : "SUCCESS"}
        >
            {data?.membership?.status === "JOINED" ? "Leave" : "Join"}
        </Button>
    )
}
