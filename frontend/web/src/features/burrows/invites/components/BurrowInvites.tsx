import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router"
import {
    getInvites,
    cancelInvite,
    createInvite
} from "@features/burrows/invites/invites.api.ts"
import type { InviteWithUsers } from "@features/burrows/burrows.types.ts"
import { Button, Card, Input } from "@umnburrow/core"
import { formatTimeAgo } from "@api/util.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"
import { useState } from "react"
import { getUserByUsername } from "@features/profile/profile.api.ts"

/**
 * Component to display a single invite.
 */
function InviteItem({ invite }: { invite: InviteWithUsers }) {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()
    const nav = useNavigate()

    // Cancel invite mutation
    const cancelMutation = useMutation({
        mutationFn: async () =>
            await cancelInvite(id!, invite.invite.inviteeID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["invites", id]
            })
        }
    })

    return (
        <li className="border-background/80 bg-background/60 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-full">
                        <div
                            className="mb-4 flex cursor-pointer flex-row items-center gap-2"
                            onClick={() =>
                                nav(`/user/${invite.inviteeUsername}`)
                            }
                        >
                            <ProfilePicture
                                name={
                                    invite.inviteeProfile?.name ||
                                    invite.inviteeUsername
                                }
                                userID={invite.invite.inviteeID}
                                size={"sm"}
                            />

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                    {invite.inviteeProfile?.name ||
                                        invite.inviteeUsername}
                                </span>

                                <span className="text-text/70 text-xs">
                                    {invite.inviteeUsername}
                                </span>
                            </div>
                        </div>

                        <div className="text-text/50 text-xs">
                            Invited {formatTimeAgo(invite.invite.createdAt)}
                            {invite.invite.expiresAt && (
                                <>
                                    {" "}
                                    • Expires{" "}
                                    {formatTimeAgo(invite.invite.expiresAt)}
                                </>
                            )}
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
                    color={"ERROR"}
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    aria-label={`Cancel invite to ${invite.inviteeUsername}`}
                    title="Cancel invite"
                    loading={cancelMutation.isPending}
                >
                    {cancelMutation.isPending ? "Canceling" : "Cancel Invite"}
                </Button>
            </div>
        </li>
    )
}

/**
 * Form to create a new invite.
 */
function CreateInviteForm() {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()
    const [username, setUsername] = useState("")
    const [error, setError] = useState<string | null>(null)

    const createInviteMutation = useMutation({
        mutationFn: async (inviteeUsername: string) => {
            const user = await getUserByUsername(inviteeUsername)
            await createInvite(id!, user.user.id)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["invites", id]
            })
            setUsername("")
            setError(null)
        },
        onError: (err: Error) => {
            setError(err.message || "Failed to create invite")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!username.trim()) {
            setError("Please enter a username")
            return
        }

        createInviteMutation.mutate(username.trim())
    }

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-2">
                    <Input
                        id="username"
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={createInviteMutation.isPending}
                        className="flex-1"
                    />

                    <Button
                        type="submit"
                        disabled={
                            createInviteMutation.isPending || !username.trim()
                        }
                        loading={createInviteMutation.isPending}
                    >
                        Invite
                    </Button>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        </form>
    )
}

/**
 * Display all pending invites for the burrow.
 * Only visible to hosts and moderators.
 */
export default function BurrowInvites() {
    const { id } = useParams<{ id: string }>()

    const { data, isLoading, isError, error } = useQuery<InviteWithUsers[]>({
        queryKey: ["invites", id],
        queryFn: async () => await getInvites(id!),
        enabled: !!id
    })

    if (isLoading) {
        return <Card title="Invites">Loading invites...</Card>
    }

    if (isError) {
        return (
            <Card title="Invites">
                {(error as Error)?.message || "Failed to load invites"}
            </Card>
        )
    }

    return (
        <Card title="Invites">
            <CreateInviteForm />

            {!data || data.length === 0 ? (
                <p className="text-text/70 text-sm">No pending invites.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {data.map((invite) => (
                        <InviteItem
                            key={invite.invite.inviteeID}
                            invite={invite}
                        />
                    ))}
                </ul>
            )}
        </Card>
    )
}
