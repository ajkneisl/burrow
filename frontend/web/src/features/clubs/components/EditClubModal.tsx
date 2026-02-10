import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Input, Modal, SelectInput, TextArea, Toggle, ViewErrors } from "@umnburrow/core"
import { updateClub } from "@features/clubs/clubs.api.ts"
import type { Club, ClubCategory, ClubPrivacy } from "@features/clubs/clubs.types.ts"
import Field from "@features/burrows/create/components/Field.tsx"
import { capitalizeFirstLetter } from "@api/util.ts"
import { toast } from "react-hot-toast"

type EditClubFormState = {
    displayName: string
    description: string
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
}

type EditClubModalProps = {
    open: boolean
    onClose: () => void
    club: Club
}

export default function EditClubModal({ open, onClose, club }: EditClubModalProps) {
    const queryClient = useQueryClient()

    const [formState, setFormState] = useState<EditClubFormState>({
        displayName: club.displayName,
        description: club.description,
        category: club.category,
        privacy: club.privacy,
        requestToJoin: club.requestToJoin,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [serverErrors, setServerErrors] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            setFormState({
                displayName: club.displayName,
                description: club.description,
                category: club.category,
                privacy: club.privacy,
                requestToJoin: club.requestToJoin,
            })
            setErrors({})
            setServerErrors([])
            setCurrentStep(1)
        }
    }, [open, club])

    const updateField = useCallback(
        <K extends keyof EditClubFormState>(field: K, value: EditClubFormState[K]) => {
            setFormState((prev) => ({ ...prev, [field]: value }))
        },
        []
    )

    const validateCurrentStep = useCallback((): boolean => {
        const next: Record<string, string> = {}

        if (currentStep === 1) {
            if (!formState.displayName.trim()) next.displayName = "Required"
            else if (formState.displayName.trim().length > 32)
                next.displayName = "Must be 32 characters or fewer"
        }

        setErrors(next)
        return Object.keys(next).length === 0
    }, [currentStep, formState])

    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1)
            setErrors({})
        }
    }, [currentStep, validateCurrentStep])

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors({})
        }
    }, [currentStep])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validateCurrentStep()) return

        try {
            await updateClub(club.name, {
                name: club.name,
                displayName: formState.displayName.trim(),
                description: formState.description.trim(),
                category: formState.category,
                privacy: formState.privacy,
                requestToJoin: formState.requestToJoin,
                members: [],
            })

            setServerErrors([])
            void queryClient.invalidateQueries({ queryKey: ["club", club.name] })
            toast.success("Club updated.")
            onClose()
        } catch (error) {
            if (Array.isArray(error)) {
                setServerErrors(error as string[])
            } else {
                setServerErrors([error as string])
            }
        }
    }

    function onClickSubmit() {
        const form = document.getElementById("edit-club-form") as HTMLFormElement
        form.requestSubmit()
    }

    const footer = useMemo(() => {
        return (
            <div className="flex w-full items-center justify-between">
                <div className="text-text/60 text-sm">Step {currentStep} of 2</div>

                <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                        <Button color="ERROR" type="button" onClick={handleBack}>
                            Back
                        </Button>
                    )}

                    {currentStep < 2 ? (
                        <Button color="SUCCESS" type="button" onClick={handleNext}>
                            Next
                        </Button>
                    ) : (
                        <Button color="SUCCESS" type="submit" onClick={onClickSubmit}>
                            Save
                        </Button>
                    )}
                </div>
            </div>
        )
    }, [currentStep, handleBack, handleNext])

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edit Club"
            footer={footer}
            widthClass="md:min-w-xl max-w-xl"
        >
            <form id="edit-club-form" onSubmit={handleSubmit}>
                <ViewErrors errors={serverErrors} clearErrors={() => setServerErrors([])} />

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="bg-card border-card-border rounded-lg border p-4">
                            <p className="text-text mb-2 text-sm font-medium">Club Details</p>
                            <p className="text-text/60 text-xs">
                                Update your club's details. The club URL name cannot be changed.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field label="Club Name" className="min-w-0">
                                <Input value={club.name} disabled />
                            </Field>

                            <Field label="Display Name" error={errors.displayName} className="min-w-0">
                                <Input
                                    value={formState.displayName}
                                    onChange={(e) => updateField("displayName", e.target.value)}
                                    error={errors.displayName !== undefined}
                                    placeholder="My Club"
                                />
                            </Field>

                            <Field label="Category" className="min-w-0 md:col-span-2">
                                <SelectInput
                                    text="Category"
                                    items={["Sports", "Social", "Creative", "Educational"]}
                                    value={capitalizeFirstLetter(formState.category.toLowerCase())}
                                    onChange={(e) =>
                                        updateField("category", e.target.value.toUpperCase() as ClubCategory)
                                    }
                                />
                            </Field>

                            <Field label="Description" className="min-w-0 md:col-span-2">
                                <TextArea
                                    value={formState.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    placeholder="What is your club about?"
                                />
                            </Field>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="border-card-border bg-card rounded-lg border p-4">
                            <p className="text-text mb-2 text-sm font-medium">Privacy Settings</p>
                            <p className="text-text/60 text-xs">
                                Control who can see and join your club.
                            </p>
                        </div>

                        <div className="min-w-0">
                            <SelectInput
                                text="Club Privacy"
                                remark="Public: visible to everyone &bull; Unlisted: only accessible via link &bull; Private: invite-only"
                                items={["Public", "Unlisted", "Private"]}
                                value={capitalizeFirstLetter(formState.privacy.toLowerCase())}
                                onChange={(e) =>
                                    updateField("privacy", e.target.value.toUpperCase() as ClubPrivacy)
                                }
                            />
                        </div>

                        <div className="min-w-0 border-t border-neutral-200 pt-4">
                            <Toggle
                                title="Require approval to join"
                                description="When enabled, users must request to join and wait for approval from an administrator or moderator"
                                checked={formState.requestToJoin}
                                onChange={(checked) => updateField("requestToJoin", checked)}
                            />
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    )
}
