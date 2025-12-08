import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { toast } from "react-hot-toast"
import { joinMeeting, leaveMeeting } from "@features/burrows/burrows.api.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@umnburrow/core"
import { useMemo, useState } from "react"
import { cancelJoinRequest } from "@features/burrows/attendees/attendees.api.ts"

/**
 * {@see JoinBurrow}
 */
type JoinMeetingProps = {
    inPast: boolean
    data: BurrowResponse
}

/**
 * Join a meeting.
 * @param data The meeting data.
 * @param inPast If the meeting is in the past.
 *
 * @author AJ Kneisl
 */
export default function JoinBurrow({ data, inPast }: JoinMeetingProps) {
    const user = useUser()
    const queryClient = useQueryClient()

    const [isLoading, setIsLoading] = useState(false)

    // Update join request status in cache
    const setRequested = (status: boolean) => {
        queryClient.setQueryData<BurrowResponse>(
            ["burrow", data.burrow.id],
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

        setIsLoading(true)

        try {
            // Handle leave
            if (data.membership?.status === "JOINED") {
                await leaveMeeting(burrowID)

                void queryClient.invalidateQueries({
                    queryKey: ["burrow", burrowID]
                })

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
                // join successfully
                void queryClient.invalidateQueries({
                    queryKey: ["burrow", burrowID]
                })
            } else {
                // request to join
                setRequested(true)
                toast.success("You have requested to join.")
            }
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "An error occurred"
            )
        } finally {
            setIsLoading(false)
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
    }, [
        data.burrow.requestToJoin,
        data.membership?.status,
        data.requestedToJoin
    ])

    const isDestructiveAction =
        buttonText === "Leave" || buttonText === "Cancel Request"

    return (
        <Button
            thin
            onClick={handleJoinLeave}
            disabled={!user || inPast}
            loading={isLoading}
            color={isDestructiveAction ? "ERROR" : "SUCCESS"}
        >
            {buttonText}
        </Button>
    )
}
