import { inviteToClub } from "@umnburrow/core/api"
import React, { useEffect, useState } from "react"
import { Button, Modal, ViewErrors } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import { toast } from "react-hot-toast"
import SelectUser from "@features/profile/components/SelectUser.tsx"
import type { UserSearchResult } from "@features/profile/components/SelectUser.tsx"

/**
 * {@link InviteClubMemberModal}
 */
type InviteClubMemberModalProps = {
    open: boolean
    onClose: () => void
    clubName: string
}

/**
 * Screen to invite a club member.
 *
 * @param open If the modal is opened.
 * @param onClose Function to close the modal.
 * @param clubName The name of the club.
 * @author AJ Kneisl
 */
export default function InviteClubMemberModal({
    open,
    onClose,
    clubName
}: InviteClubMemberModalProps) {
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
        null
    )
    const [loading, setLoading] = useState(false)
    const [serverErrors, setServerErrors] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            setSelectedUser(null)
            setServerErrors([])
        }
    }, [open])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedUser) return

        setLoading(true)
        try {
            await inviteToClub(clubName, selectedUser.id)
            toast.success("Invite sent!")
            onClose()
        } catch (error) {
            if (Array.isArray(error)) {
                setServerErrors(error as string[])
            } else {
                setServerErrors([error as string])
            }
        } finally {
            setLoading(false)
        }
    }

    const footer = (
        <div className="flex w-full justify-end">
            <Button
                color="SUCCESS"
                type="submit"
                loading={loading}
                disabled={!selectedUser}
                onClick={() => {
                    const form = document.getElementById(
                        "invite-club-member-form"
                    ) as HTMLFormElement
                    form.requestSubmit()
                }}
            >
                Send Invite
            </Button>
        </div>
    )

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Invite Member"
            footer={footer}
            widthClass="md:min-w-md md:max-w-md max-w-sm min-w-sm"
        >
            <form id="invite-club-member-form" onSubmit={handleSubmit}>
                <ViewErrors
                    errors={serverErrors}
                    clearErrors={() => setServerErrors([])}
                />

                <Field label="Search User">
                    <SelectUser
                        value={selectedUser}
                        onChange={setSelectedUser}
                    />
                </Field>
            </form>
        </Modal>
    )
}
