import type {
    BurrowResponse,
    BurrowMemberStatus
} from "@features/burrows/burrows.types.ts"
import { toast } from "react-hot-toast"
import { joinMeeting, leaveMeeting } from "@features/burrows/burrows.api.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@umnburrow/core"
import { useMemo } from "react"
import { cancelJoinRequest } from "@features/burrows/attendees/attendees.api.ts"

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
    const queryClient = useQueryClient()

    // Update membership status in cache
    const setMembershipStatus = (status: BurrowMemberStatus) => {
        queryClient.setQueryData<BurrowResponse>(
            ["meeting", data.burrow.id],
            (old) => {
                if (!old) return old

                return {
                    ...old,
                    burrow: {
                        ...old.burrow,
                        joined:
                            status === "JOINED"
                                ? old.burrow.joined + 1
                                : old.burrow.joined - 1
                    },
                    membership: old.membership
                        ? {
                              ...old.membership,
                              status
                          }
                        : undefined
                }
            }
        )
    }

    // Update join request status in cache
    const setRequested = (status: boolean) => {
        queryClient.setQueryData<BurrowResponse>(
            ["meeting", data.burrow.id],
            (old) => {
                if (!old) return old

                return {
                    ...old,
                    requestedToJoin: status
                }
            }
        )
    }

    const handleJoinLeave = async () => {
        const burrowID = data.burrow.id
        if (!burrowID || !user) return

        if (data.burrow.ownerID === user.id) {
            toast.error("You cannot leave your own meeting!")
            return
        }

        try {
            // Handle leave
            if (data.membership?.status === "JOINED") {
                setMembershipStatus("LEFT")
                await leaveMeeting(burrowID)
                return
            }

            // Handle cancel request
            if (data.requestedToJoin) {
                setRequested(false)
                await cancelJoinRequest(burrowID)
                return
            }

            // Handle join
            await joinMeeting(burrowID)

            if (!data.burrow.requestToJoin) {
                setMembershipStatus("JOINED")
            } else {
                setRequested(true)
                toast.success("You have requested to join.")
            }
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "An error occurred"
            )
        }
    }

    const buttonText = useMemo(() => {
        const status = data.membership?.status

        if (status === "JOINED" || status === "WAITLISTED") {
            return "Leave"
        }

        if (data.requestedToJoin) {
            return "Cancel Request"
        }

        return data.burrow.requestToJoin ? "Request to Join" : "Join"
    }, [data.burrow.requestToJoin, data.membership?.status, data.requestedToJoin])

    const isDestructiveAction =
        buttonText === "Leave" || buttonText === "Cancel Request"

    return (
        <Button
            thin
            onClick={handleJoinLeave}
            disabled={!user || inPast}
            color={isDestructiveAction ? "ERROR" : "SUCCESS"}
        >
            {buttonText}
        </Button>
    )
}
