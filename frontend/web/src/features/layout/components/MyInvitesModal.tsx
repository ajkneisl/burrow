import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import {
    getReceivedInvites,
    acceptInvite,
    declineInvite,
    getMeeting
} from "@features/burrows/burrows.api.ts"
import type { InviteWithUsers } from "@features/burrows/burrows.types.ts"
import { Button, Card, Modal } from "@umnburrow/core"
import { formatTimeAgo } from "@api/util.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"
import {myInvitesModalOpen} from "@features/layout/layout.atom.ts";

/**
 * Component to display a single received invite.
 */
function ReceivedInviteItem({ invite }: { invite: InviteWithUsers }) {
    const [auth] = useAtom(authToken)
    const queryClient = useQueryClient()
    const nav = useNavigate()

    // get burrow details
    const { data: burrowData } = useQuery({
        queryKey: ["meeting", invite.invite.burrowID],
        queryFn: async () => await getMeeting(invite.invite.burrowID, auth!),
        enabled: !!auth
    })

    // accept the invitation
    const acceptMutation = useMutation({
        mutationFn: async () =>
            await acceptInvite(auth!, invite.invite.burrowID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["receivedInvites"]
            })
            await queryClient.invalidateQueries({
                queryKey: ["meeting", invite.invite.burrowID]
            })
        }
    })

    // decline invitation
    const declineMutation = useMutation({
        mutationFn: async () =>
            await declineInvite(auth!, invite.invite.burrowID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["receivedInvites"]
            })
        }
    })

    return (
        <Card>
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div
                            className="mb-2 flex cursor-pointer flex-row items-center gap-2"
                            onClick={() => nav(`/user/${invite.inviterUsername}`)}
                        >
                            <ProfilePicture
                                name={invite.inviterProfile?.name || invite.inviterUsername}
                                userID={invite.invite.inviterID}
                                size={"sm"}
                            />

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                    {invite.inviterProfile?.name || invite.inviterUsername}
                                </span>
                                <span className="text-text/70 text-xs">
                                    {invite.inviterUsername}
                                </span>
                            </div>
                        </div>

                        {burrowData && (
                            <div
                                className="mb-2 cursor-pointer"
                                onClick={() => nav(`/burrow/${invite.invite.burrowID}`)}
                            >
                                <p className="text-text text-sm font-semibold">
                                    {burrowData.burrow.title}
                                </p>
                                <p className="text-text/70 line-clamp-2 text-xs">
                                    {burrowData.burrow.description}
                                </p>
                            </div>
                        )}

                        <div className="text-text/50 text-xs">
                            Invited {formatTimeAgo(invite.invite.createdAt)}
                            {invite.invite.expiresAt && (
                                <> • Expires {formatTimeAgo(invite.invite.expiresAt)}</>
                            )}
                        </div>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        PENDING
                    </span>
                </div>

                <div className="flex flex-row items-center justify-end gap-2">
                    <Button
                        thin
                        color={"ERROR"}
                        onClick={() => declineMutation.mutate()}
                        disabled={
                            acceptMutation.isPending || declineMutation.isPending
                        }
                        aria-label={`Decline invite from ${invite.inviterUsername}`}
                        title="Decline invite"
                        loading={declineMutation.isPending}
                    >
                        {declineMutation.isPending ? "Declining" : "Decline"}
                    </Button>

                    <Button
                        thin
                        color={"SUCCESS"}
                        onClick={() => acceptMutation.mutate()}
                        disabled={
                            acceptMutation.isPending || declineMutation.isPending
                        }
                        aria-label={`Accept invite from ${invite.inviterUsername}`}
                        title="Accept invite"
                        loading={acceptMutation.isPending}
                    >
                        {acceptMutation.isPending ? "Accepting" : "Accept"}
                    </Button>
                </div>
            </div>
        </Card>
    )
}

/**
 * Modal to display all received invites for the authenticated user.
 */
export default function MyInvitesModal() {
    const [auth] = useAtom(authToken)
    const [open, setOpen] = useAtom(myInvitesModalOpen)

    const { data, isLoading, isError, error } = useQuery<InviteWithUsers[]>({
        queryKey: ["receivedInvites"],
        queryFn: async () => await getReceivedInvites(auth!, "PENDING"),
        enabled: !!auth && open
    })

    return (
        <Modal
            title="My Invites"
            open={open}
            onClose={() => setOpen(false)}
            widthClass="max-w-2xl"
        >
            <div className="flex flex-col gap-4">
                {isLoading && (
                    <p className="text-text/70 text-sm">Loading invites...</p>
                )}

                {isError && (
                    <p className="text-sm text-red-600">
                        {(error as Error)?.message || "Failed to load invites"}
                    </p>
                )}

                {!isLoading && !isError && (!data || data.length === 0) && (
                    <p className="text-text/70 text-sm">
                        You don't have any pending invites.
                    </p>
                )}

                {!isLoading && !isError && data && data.length > 0 && (
                    <ul className="flex flex-col gap-3">
                        {data.map((invite) => (
                            <ReceivedInviteItem
                                key={`${invite.invite.burrowID}-${invite.invite.inviterID}`}
                                invite={invite}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    )
}
