import { ClubResponse } from "@features/clubs/club.types"
import { Button } from "@components/core"
import { useMemo, useState } from "react"
import { getUser } from "@features/auth/user.api"
import useClubRole from "@features/clubs/hooks/useClubRole"
import { del, post } from "@api/api"
import { useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"

type ClubJoinProps = {
    clubResponse: ClubResponse
}

export default function ClubJoin({ clubResponse }: ClubJoinProps) {
    const user = getUser()
    const queryClient = useQueryClient()

    const name = clubResponse.club.name

    const { isMember } = useClubRole(name)

    const [joinLoading, setJoinLoading] = useState(false)

    // on join / leave
    const handleJoinLeave = async () => {
        if (!user) return
        setJoinLoading(true)

        try {
            if (isMember) {
                await post(`/clubs/${name}/leave`)

                void queryClient.invalidateQueries({ queryKey: ["club", name] })
                void queryClient.invalidateQueries({
                    queryKey: ["clubMembers", name]
                })
            } else if (clubResponse?.requestedToJoin) {
                await del(`/clubs/${name}/requests`)

                queryClient.setQueryData<ClubResponse>(["club", name], (old) =>
                    old ? { ...old, requestedToJoin: false } : old
                )
            } else {
                await post(`/clubs/${name}/join`)

                if (clubResponse?.club?.requestToJoin) {
                    queryClient.setQueryData<ClubResponse>(
                        ["club", name],
                        (old) => (old ? { ...old, requestedToJoin: true } : old)
                    )

                    Toast.show({ type: "success", text1: "Request sent!" })
                } else {
                    void queryClient.invalidateQueries({
                        queryKey: ["club", name]
                    })

                    void queryClient.invalidateQueries({
                        queryKey: ["clubMembers", name]
                    })
                }
            }
        } catch (err) {
            Toast.show({
                type: "error",
                text1: typeof err === "string" ? err : "An error occurred"
            })
        } finally {
            setJoinLoading(false)
        }
    }

    const joinButtonText = useMemo(() => {
        if (isMember) return "Leave"
        if (clubResponse?.requestedToJoin) return "Cancel Request"
        return clubResponse?.club?.requestToJoin ? "Request to Join" : "Join"
    }, [
        isMember,
        clubResponse?.requestedToJoin,
        clubResponse?.club?.requestToJoin
    ])

    const isDestructive =
        joinButtonText === "Leave" || joinButtonText === "Cancel Request"

    return (
        <Button
            variant={isDestructive ? "danger" : "success"}
            size="sm"
            onPress={handleJoinLeave}
            disabled={!user}
            loading={joinLoading}
        >
            {joinButtonText}
        </Button>
    )
}
