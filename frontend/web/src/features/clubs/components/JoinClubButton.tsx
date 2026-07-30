import { cancelClubJoinRequest, joinClub, leaveClub } from "@umnburrow/core/api"
import type { ClubResponse } from "@umnburrow/core/api"
import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@umnburrow/core"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"
import { toast } from "react-hot-toast"

/**
 * {@link JoinClubButton}
 */
type JoinClubButtonProps = {
    clubName: string
}

/**
 * Button to join a club.
 *
 * @param clubName The name of the club.
 * @author AJ Kneisl
 */
export default function JoinClubButton({
    clubName,
}: JoinClubButtonProps) {
    const { isOwner, isMember, user, data } = useClubRole(clubName)
    const requestedToJoin = data?.requestedToJoin ?? false
    const requestToJoin = data?.club?.requestToJoin ?? false
    const hasUser = !!user
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const buttonText = useMemo(() => {
        if (isMember) return "Leave"
        if (requestedToJoin) return "Cancel Request"
        return requestToJoin ? "Request to Join" : "Join"
    }, [isMember, requestedToJoin, requestToJoin])

    const isDestructive = buttonText === "Leave" || buttonText === "Cancel Request"

    async function handleClick() {
        if (!hasUser) return
        setLoading(true)

        try {
            if (isMember) {
                await leaveClub(clubName)
                void queryClient.invalidateQueries({ queryKey: ["club", clubName] })
                void queryClient.invalidateQueries({ queryKey: ["clubMembers", clubName] })
            } else if (requestedToJoin) {
                await cancelClubJoinRequest(clubName)
                queryClient.setQueryData<ClubResponse>(["club", clubName], (old) =>
                    old ? { ...old, requestedToJoin: false } : old
                )
            } else {
                await joinClub(clubName)
                if (requestToJoin) {
                    queryClient.setQueryData<ClubResponse>(["club", clubName], (old) =>
                        old ? { ...old, requestedToJoin: true } : old
                    )
                    toast.success("You have requested to join.")
                } else {
                    void queryClient.invalidateQueries({ queryKey: ["club", clubName] })
                    void queryClient.invalidateQueries({ queryKey: ["clubMembers", clubName] })
                }
            }
        } catch (err) {
            toast.error(typeof err === "string" ? err : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (isOwner) return null

    return (
        <Button
            thin
            onClick={handleClick}
            disabled={!hasUser}
            loading={loading}
            color={isDestructive ? "ERROR" : "SUCCESS"}
        >
            {buttonText}
        </Button>
    )
}
