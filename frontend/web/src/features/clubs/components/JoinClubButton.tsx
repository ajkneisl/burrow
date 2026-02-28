import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@umnburrow/core"
import { joinClub, leaveClub, cancelClubJoinRequest } from "@features/clubs/clubs.api.ts"
import type { ClubResponse } from "@features/clubs/clubs.types.ts"
import { toast } from "react-hot-toast"

/**
 * {@link JoinClubButton}
 */
type JoinClubButtonProps = {
    clubName: string
    isMember: boolean
    isOwner: boolean
    requestedToJoin: boolean
    requestToJoin: boolean
    hasUser: boolean
}

/**
 * Button to join a club.
 *
 * @param clubName The name of the club.
 * @param isMember If the user is already a member.
 * @param isOwner If the user is the owner of the club.
 * @param requestedToJoin If the user has already requested to join.
 * @param requestToJoin If the club has request to join enabled.
 * @param hasUser If the club already has the user.
 * @author AJ Kneisl
 */
export default function JoinClubButton({
    clubName,
    isMember,
    isOwner,
    requestedToJoin,
    requestToJoin,
    hasUser,
}: JoinClubButtonProps) {
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
