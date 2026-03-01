import { useState } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil, UserPlus, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button, Modal } from "@umnburrow/core"
import { deleteClub } from "@features/clubs/clubs.api.ts"
import type { Club } from "@features/clubs/clubs.types.tsx"
import EditClubModal from "@features/clubs/components/EditClubModal.tsx"
import InviteClubMemberModal from "@features/clubs/components/InviteClubMemberModal.tsx"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"

type ClubModerationProps = {
    club: Club
    clubName: string
}

export default function ClubModeration({
    club,
    clubName,
}: ClubModerationProps) {
    const { isOwner, isAdmin, isMod } = useClubRole(clubName)
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const [editOpen, setEditOpen] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        setDeleting(true)

        try {
            await deleteClub(clubName)
            void queryClient.invalidateQueries({ queryKey: ["myClubs"] })
            toast.success("Club deleted.")
            setDeleteOpen(false)
            nav("/clubs")
        } catch (error) {
            toast.error(typeof error === "string" ? error : "Failed to delete club.")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            {isAdmin && (
                <Button color="SECONDARY" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                </Button>
            )}

            {isMod && (
                <Button color="INFO" onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-3.5 w-3.5" />
                    Invite
                </Button>
            )}

            {isOwner && (
                <Button color="ERROR" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                </Button>
            )}

            {/* Modals */}
            {isAdmin && (
                <EditClubModal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    club={club}
                />
            )}

            {isMod && (
                <InviteClubMemberModal
                    open={inviteOpen}
                    onClose={() => setInviteOpen(false)}
                    clubName={clubName}
                />
            )}

            {isOwner && (
                <Modal
                    open={deleteOpen}
                    onClose={() => setDeleteOpen(false)}
                    title="Delete Club"
                    footer={
                        <div className="flex w-full items-center justify-end gap-3">
                            <Button
                                color="SECONDARY"
                                onClick={() => setDeleteOpen(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="ERROR"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-3">
                        <p className="text-text/80 text-sm">
                            Are you sure you want to delete <strong>{club.displayName}</strong>?
                            This action cannot be undone.
                        </p>
                        <p className="text-text/60 text-xs">
                            All members will be removed and all club data will be permanently deleted.
                        </p>
                    </div>
                </Modal>
            )}
        </>
    )
}
