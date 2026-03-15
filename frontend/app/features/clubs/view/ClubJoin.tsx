import { View } from "react-native"
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
        if (isMember) return "Leave Club"
        if (clubResponse?.requestedToJoin) return "Cancel Request"
        return clubResponse?.club?.requestToJoin ? "Request to Join" : "Join Club"
    }, [
        isMember,
        clubResponse?.requestedToJoin,
        clubResponse?.club?.requestToJoin
    ])

    const isDestructive =
        joinButtonText === "Leave Club" || joinButtonText === "Cancel Request"

    return (
        <View className="px-6 py-3 bg-background">
            <Button
                variant={isDestructive ? "danger" : "primary"}
                onPress={handleJoinLeave}
                disabled={!user}
                loading={joinLoading}
            >
                {joinButtonText}
            </Button>
        </View>
    )
}
