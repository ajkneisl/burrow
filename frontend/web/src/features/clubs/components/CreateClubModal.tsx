import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Input, Modal, SelectInput, TextArea, Toggle, ViewErrors } from "@umnburrow/core"
import { createClub } from "@features/clubs/clubs.api.ts"
import type { ClubCategory, ClubPrivacy } from "@features/clubs/clubs.types.ts"
import Field from "@features/burrows/create/components/Field.tsx"
import { capitalizeFirstLetter } from "@api/util.ts"

type CreateClubFormState = {
    name: string
    displayName: string
    description: string
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
}

const initialFormState: CreateClubFormState = {
    name: "",
    displayName: "",
    description: "",
    category: "SOCIAL",
    privacy: "PUBLIC",
    requestToJoin: false
}

type CreateClubModalProps = {
    open: boolean
    onClose: () => void
}

export default function CreateClubModal({ open, onClose }: CreateClubModalProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const [formState, setFormState] = useState<CreateClubFormState>(initialFormState)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [serverErrors, setServerErrors] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            setFormState(initialFormState)
            setErrors({})
            setServerErrors([])
            setCurrentStep(1)
        }
    }, [open])

    const updateField = useCallback(
        <K extends keyof CreateClubFormState>(field: K, value: CreateClubFormState[K]) => {
            setFormState((prev) => ({ ...prev, [field]: value }))
        },
        []
    )

    const validateCurrentStep = useCallback((): boolean => {
        const next: Record<string, string> = {}

        if (currentStep === 1) {
            if (!formState.name.trim()) next.name = "Required"
            else if (!/^[a-z0-9-]+$/.test(formState.name.trim()))
                next.name = "Only lowercase letters, numbers, and hyphens"
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
            const club = await createClub({
                name: formState.name.trim(),
                displayName: formState.displayName.trim(),
                description: formState.description.trim(),
                category: formState.category,
                privacy: formState.privacy,
                requestToJoin: formState.requestToJoin,
                members: []
            })

            setServerErrors([])
            void queryClient.invalidateQueries({ queryKey: ["myClubs"] })
            onClose()
            nav(`/club/${club.name}`)
        } catch (error) {
            if (Array.isArray(error)) {
                setServerErrors(error as string[])
            } else {
                setServerErrors([error as string])
            }
        }
    }

    function onClickSubmit() {
        const form = document.getElementById("create-club-form") as HTMLFormElement
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
                            Create
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
            title="Create Club"
            footer={footer}
            widthClass="md:min-w-xl max-w-xl"
        >
            <form id="create-club-form" onSubmit={handleSubmit}>
                <ViewErrors errors={serverErrors} clearErrors={() => setServerErrors([])} />

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="bg-card border-card-border rounded-lg border p-4">
                            <p className="text-text mb-2 text-sm font-medium">Club Details</p>
                            <p className="text-text/60 text-xs">
                                Give your club a name and description. The club name is used in
                                URLs and must be unique.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field label="Club Name" error={errors.name} className="min-w-0">
                                <Input
                                    value={formState.name}
                                    onChange={(e) => updateField("name", e.target.value.toLowerCase().replace(/\s/g, "-"))}
                                    error={errors.name !== undefined}
                                    placeholder="my-club"
                                />
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
                                Control who can see and join your club. You can change these
                                settings later.
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
