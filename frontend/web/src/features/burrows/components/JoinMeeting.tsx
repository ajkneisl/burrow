import type {
    BurrowResponse,
    BurrowMemberStatus
} from "@features/burrows/burrows.types.ts"
import { toast } from "react-hot-toast"
import { joinMeeting, leaveMeeting } from "@features/burrows/burrows.api.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import { useQueryClient } from "@tanstack/react-query"
import useToken from "@features/auth/hooks/useToken.ts"
import { Button } from "@umnburrow/core"

/**
 * {@see JoinMeeting}
 */
type JoinMeetingProps = {
    inPast: boolean
    data: BurrowResponse
}

/**
 * Join a meeting.
 * @param data The meeting data.
 * @param inPast If the meeting is in the past.
 */
export default function JoinMeeting({ data, inPast }: JoinMeetingProps) {
    const user = useUser()
    const auth = useToken()

    const queryClient = useQueryClient()

    const setMembershipStatus = (status: BurrowMemberStatus) => {
        queryClient.setQueryData(["meeting", data.burrow.id], (old: any) => {
            if (!old) return old

            return {
                ...old,
                burrow: {
                    ...(old.burrow ?? {}),
                    joined:
                        status === "JOINED"
                            ? old.burrow.joined + 1
                            : old.burrow.joined - 1
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

        if (data?.burrow?.ownerID === user?.id) {
            toast.error("You cannot leave your own meeting!")
            return
        }

        if (data?.membership?.status === "JOINED") {
            setMembershipStatus("LEFT")
            await leaveMeeting(auth, data.burrow.id)
        } else {
            setMembershipStatus("JOINED")
            await joinMeeting(auth, data?.burrow?.id ?? "")
        }
    }

    return (
        <Button
            thin
            onClick={joinLeaveButton}
            disabled={auth === null || inPast}
            color={data?.membership?.status === "JOINED" ? "ERROR" : "SUCCESS"}
        >
            {data?.membership?.status === "JOINED" ? "Leave" : "Join"}
        </Button>
    )
}
