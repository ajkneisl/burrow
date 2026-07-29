import { Button, Card, Input } from "@umnburrow/core"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserByUsername } from "@features/profile/profile.api.ts"
import { createInvite } from "@features/burrows/attendees/attendees.api.ts"
import toast from "react-hot-toast"
import { X } from "lucide-react"

/**
 * {@see InviteUser}
 */
type InviteUserProps = {
    burrowID: string
    onInvite: () => void
}

/**
 * Invite a user to your Burrow.
 *
 * @param id The ID of the Burrow
 * @param onInvite When a user is invited.
 *
 * @author AJ Kneisl
 */
export default function InviteUser({ burrowID, onInvite }: InviteUserProps) {
    const queryClient = useQueryClient()

    const [isInviting, setIsInviting] = useState(false)
    const [inviteUsername, setInviteUsername] = useState("")
    const [inviteError, setInviteError] = useState<string | null>("")

    // invite the user and clear out attendees
    const inviteMutation = useMutation({
        mutationFn: async (username: string) => {
            const userResponse = await getUserByUsername(username)

            await createInvite(burrowID!, userResponse.user.id)
        },

        onSuccess: () => {
            setInviteUsername("")
            setIsInviting(false)
            setInviteError(null)

            void queryClient.invalidateQueries({
                queryKey: ["invites", burrowID, 1]
            })

            toast.success("Successfully invited user!")

            onInvite()
        },

        onError: (error: Error) => {
            setInviteError(error?.toString() || "Failed to send invite.")
        }
    })

    const handleInvite = () => {
        if (!inviteUsername.trim()) {
            setInviteError("Please enter a username")
            return
        }
        setInviteError(null)
        inviteMutation.mutate(inviteUsername.trim())
    }

    if (!isInviting) {
        return (
            <Card
                onClick={() => setIsInviting(true)}
                aria-live="polite"
                aria-label="No upcoming meetings"
                className="invite-border-dashed mt-4 flex h-8 w-full cursor-pointer items-center justify-center border-2 border-text/40 text-text/50 opacity-50 transition-all hover:border-text/60 hover:bg-background/60 hover:opacity-75"
            >
                <p className="text-center text-sm tracking-wide">Invite</p>
            </Card>
        )
    }

    const cancelButton = (
        <button
            onClick={() => {
                setIsInviting(false)
                setInviteUsername("")
                setInviteError(null)
            }}
            className="flex size-5 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300"
            aria-label="Cancel invite"
        >
            <X className="size-3" />
        </button>
    )

    return (
        <div className="mt-4">
            <div className="flex flex-row items-center gap-2 md:min-w-xs">
                <Input
                    className="w-1/2 py-1.5!"
                    placeholder="invite username..."
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleInvite()
                        }
                    }}
                    error={inviteError !== null}
                    remark={inviteError !== null ? inviteError : undefined}
                    endAdornment={cancelButton}
                />

                <Button
                    color="SUCCESS"
                    className="self-start"
                    onClick={handleInvite}
                    disabled={inviteMutation.isPending}
                >
                    {inviteMutation.isPending ? "Inviting..." : "Invite"}
                </Button>
            </div>
        </div>
    )
}
