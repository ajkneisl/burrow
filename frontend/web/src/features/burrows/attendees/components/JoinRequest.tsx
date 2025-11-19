import type { JoinRequestWithUser } from "@features/burrows/burrows.types.ts"
import { formatTimeAgo } from "@api/util.ts"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    acceptJoinRequest,
    denyJoinRequest
} from "@features/burrows/attendees/attendees.api.ts"
import { useParams } from "react-router"
import DisplayMember from "@features/burrows/attendees/components/DisplayMember.tsx"

/**
 * A representation of a received join request.
 *
 * @param request The request data.
 *
 * @author AJ Kneisl
 */
export default function JoinRequest({
    request
}: {
    request: JoinRequestWithUser
}) {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()

    // accept and refresh the attendees
    const acceptMutation = useMutation({
        mutationFn: async () => {
            await acceptJoinRequest(id!, request.request.requesterID)
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["joinRequests", id]
            })
            void queryClient.invalidateQueries({ queryKey: ["attendees", id] })
        }
    })

    // deny and refresh the join requests
    const denyMutation = useMutation({
        mutationFn: async () => {
            await denyJoinRequest(id!, request.request.requesterID)
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["joinRequests", id]
            })
        }
    })

    return (
        <DisplayMember
            username={request.requester}
            profile={request.requesterProfile}
            isSelf={false}
            statusText={"Requested"}
            statusColor={"border-blue-300 text-blue-800 bg-blue-100 "}
            footer={`Requested ${formatTimeAgo(request.request.createdAt)}`}
            functions={{
                Accept: () => acceptMutation.mutate(),
                Deny: () => denyMutation.mutate()
            }}
        />
    )
}
