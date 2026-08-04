import { acceptInvite, declineInvite, formatTimeAgo, getBurrow, getReceivedInvites, humanDateLabel } from "@umnburrow/core/api"
import type { InviteWithUsers } from "@umnburrow/core/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Button, Card, Modal } from "@umnburrow/core"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"
import { myInvitesModalOpen } from "@features/layout/layout.atom.ts"

/**
 * Component to display a single received invite.
 */
function ReceivedInviteItem({ invite }: { invite: InviteWithUsers }) {
    const queryClient = useQueryClient()
    const nav = useNavigate()

    // get burrow details
    const { data: burrowData } = useQuery({
        queryKey: ["burrow", invite.invite.burrowID],
        queryFn: async () => await getBurrow(invite.invite.burrowID)
    })

    // accept the invitation
    const acceptMutation = useMutation({
        mutationFn: async () => await acceptInvite(invite.invite.burrowID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["receivedInvites"]
            })
            await queryClient.invalidateQueries({
                queryKey: ["burrow", invite.invite.burrowID]
            })
        }
    })

    // decline invitation
    const declineMutation = useMutation({
        mutationFn: async () => await declineInvite(invite.invite.burrowID),
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
                            onClick={() =>
                                nav(`/user/${invite.inviterUsername}`)
                            }
                        >
                            <ProfilePicture
                                name={
                                    invite.inviterProfile?.name ||
                                    invite.inviterUsername
                                }
                                userID={invite.invite.inviterID}
                                size={"sm"}
                            />

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                    {invite.inviterProfile?.name ||
                                        invite.inviterUsername}
                                </span>
                                <span className="text-xs text-text/70">
                                    {invite.inviterUsername}
                                </span>
                            </div>
                        </div>

                        {burrowData && (
                            <div
                                className="mb-2 cursor-pointer"
                                onClick={() =>
                                    nav(`/burrow/${invite.invite.burrowID}`)
                                }
                            >
                                <p className="text-sm font-semibold text-text">
                                    {burrowData.burrow.title}
                                </p>
                                <p className="line-clamp-2 text-xs text-text/70">
                                    {burrowData.burrow.description}
                                </p>
                            </div>
                        )}

                        <div className="text-xs text-text/50">
                            Invited {formatTimeAgo(invite.invite.createdAt)}
                            {invite.invite.expiresAt && (
                                <>
                                    {" "}
                                    • Expires{" "}
                                    {invite.invite.expiresAt > Date.now()
                                        ? humanDateLabel(
                                              invite.invite.expiresAt
                                          )
                                        : formatTimeAgo(
                                              invite.invite.expiresAt
                                          )}
                                </>
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
                            acceptMutation.isPending ||
                            declineMutation.isPending
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
                            acceptMutation.isPending ||
                            declineMutation.isPending
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
    const [open, setOpen] = useAtom(myInvitesModalOpen)

    const { data, isLoading, isError, error } = useQuery<InviteWithUsers[]>({
        queryKey: ["receivedInvites"],
        queryFn: async () => await getReceivedInvites("PENDING"),
        enabled: open
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
                    <p className="text-sm text-text/70">Loading invites...</p>
                )}

                {isError && (
                    <p className="text-sm text-red-600">
                        {(error as Error)?.message || "Failed to load invites"}
                    </p>
                )}

                {!isLoading && !isError && (!data || data.length === 0) && (
                    <p className="text-sm text-text/70">
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
