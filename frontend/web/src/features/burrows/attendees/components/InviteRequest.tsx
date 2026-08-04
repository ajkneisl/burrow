import { cancelInvite, formatTimeAgo } from "@umnburrow/core/api"
import type { InviteWithUsers } from "@umnburrow/core/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router"
import DisplayMember from "@features/burrows/attendees/components/DisplayMember.tsx"
import { Hover } from "@umnburrow/core"
/**
 * A representation of a sent invite.
 *
 * @param invite The invite that was sent
 *
 * @author AJ Kneisl
 */
export default function InviteRequest({ invite }: { invite: InviteWithUsers }) {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()

    // cancels the invite and refreshes the invites and attendees
    const cancelMutation = useMutation({
        mutationFn: async () => {
            await cancelInvite(invite.invite.burrowID, invite.invite.inviteeID)
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["invites", id] })
            void queryClient.invalidateQueries({ queryKey: ["attendees", id] })
        }
    })

    return (
        <DisplayMember
            username={invite.inviteeUsername}
            profile={invite.inviteeProfile!}
            isSelf={false}
            statusText={"Invited"}
            statusColor={"text-gray-800 border-gray-300 bg-gray-100"}
            footer={
                <Hover
                    content={`Invited ${formatTimeAgo(invite.invite.createdAt)}`}
                >
                    Invited by @{invite.inviterUsername}
                </Hover>
            }
            functions={{ Cancel: () => cancelMutation.mutate() }}
        />
    )
}
