import React, { useEffect, useState } from "react"
import { Button, Input, Modal, ViewErrors } from "@umnburrow/core"
import { inviteToClub } from "@features/clubs/clubs.api.ts"
import Field from "@features/burrows/create/components/Field.tsx"
import { toast } from "react-hot-toast"

type InviteClubMemberModalProps = {
    open: boolean
    onClose: () => void
    clubName: string
}

export default function InviteClubMemberModal({ open, onClose, clubName }: InviteClubMemberModalProps) {
    const [userId, setUserId] = useState("")
    const [loading, setLoading] = useState(false)
    const [serverErrors, setServerErrors] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            setUserId("")
            setServerErrors([])
        }
    }, [open])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const trimmed = userId.trim()
        if (!trimmed) return

        setLoading(true)
        try {
            await inviteToClub(clubName, trimmed)
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
                disabled={!userId.trim()}
                onClick={() => {
                    const form = document.getElementById("invite-club-member-form") as HTMLFormElement
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
            widthClass="md:min-w-md max-w-md"
        >
            <form id="invite-club-member-form" onSubmit={handleSubmit}>
                <ViewErrors errors={serverErrors} clearErrors={() => setServerErrors([])} />

                <Field label="User ID">
                    <Input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter user ID"
                    />
                </Field>
            </form>
        </Modal>
    )
}
