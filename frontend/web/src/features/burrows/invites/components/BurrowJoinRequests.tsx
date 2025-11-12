import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router"
import {
    getJoinRequests,
    acceptJoinRequest,
    denyJoinRequest
} from "@features/burrows/invites/invites.api.ts"
import type { JoinRequestWithUser } from "@features/burrows/burrows.types.ts"
import { Button, Card } from "@umnburrow/core"
import { formatTimeAgo } from "@api/util.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"

/**
 * Component to display a single join request.
 */
function JoinRequestItem({ request }: { request: JoinRequestWithUser }) {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()
    const nav = useNavigate()

    // Accept request mutation
    const acceptMutation = useMutation({
        mutationFn: async () =>
            await acceptJoinRequest(id!, request.request.requesterID),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["joinRequests", id]
                }),
                queryClient.invalidateQueries({
                    queryKey: ["attendees", id]
                }),
                queryClient.invalidateQueries({
                    queryKey: ["meeting", id]
                })
            ])
        }
    })

    // Deny request mutation
    const denyMutation = useMutation({
        mutationFn: async () =>
            await denyJoinRequest(id!, request.request.requesterID),
        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["joinRequests", id]
            })
    })

    return (
        <li className="border-background/80 bg-background/60 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <div
                            className="mb-4 flex cursor-pointer flex-row items-center gap-2"
                            onClick={() => nav(`/user/${request.requester}`)}
                        >
                            <ProfilePicture
                                name={request.requesterProfile.name}
                                userID={request.request.requesterID}
                                size={"sm"}
                            />

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                    {request.requesterProfile.name}
                                </span>

                                <span className="text-text/70 text-xs">
                                    {request.requester}
                                </span>
                            </div>
                        </div>

                        <div className="text-text/50 text-xs">
                            Requested {formatTimeAgo(request.request.createdAt)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        PENDING
                    </span>
                </div>
            </div>

            <div className="mt-4 flex flex-row items-center justify-center gap-2">
                <Button
                    thin
                    color={"SUCCESS"}
                    onClick={() => acceptMutation.mutate()}
                    disabled={
                        acceptMutation.isPending || denyMutation.isPending
                    }
                    aria-label={`Accept join request from ${request.requester}`}
                    title="Accept request"
                    loading={acceptMutation.isPending}
                >
                    {acceptMutation.isPending ? "Accepting" : "Accept"}
                </Button>

                <Button
                    thin
                    color={"ERROR"}
                    onClick={() => denyMutation.mutate()}
                    disabled={
                        acceptMutation.isPending || denyMutation.isPending
                    }
                    aria-label={`Deny join request from ${request.requester}`}
                    title="Deny request"
                    loading={denyMutation.isPending}
                >
                    {denyMutation.isPending ? "Denying&" : "Deny"}
                </Button>
            </div>
        </li>
    )
}

/**
 * Display all users requesting to join the burrow.
 * Only visible to hosts and moderators.
 */
export default function BurrowJoinRequests() {
    const { id } = useParams<{ id: string }>()

    const { data, isLoading, isError, error } = useQuery<JoinRequestWithUser[]>(
        {
            queryKey: ["joinRequests", id],
            queryFn: async () => await getJoinRequests(id!),
            enabled: !!id
        }
    )

    if (isLoading) {
        return <Card title="Join Requests">Loading join requests...</Card>
    }

    if (isError) {
        return (
            <Card title="Join Requests">
                {(error as Error)?.message || "Failed to load join requests"}
            </Card>
        )
    }

    if (!data || data.length === 0) {
        return (
            <Card title="Join Requests">
                <p className="text-text/70 text-sm">
                    No pending join requests.
                </p>
            </Card>
        )
    }

    return (
        <Card title="Join Requests">
            <ul className="flex flex-col gap-3">
                {data.map((request) => (
                    <JoinRequestItem
                        key={request.request.requesterID}
                        request={request}
                    />
                ))}
            </ul>
        </Card>
    )
}
