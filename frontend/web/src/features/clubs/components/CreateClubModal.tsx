import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import {
    Button,
    Input,
    Modal,
    SelectInput,
    TextArea,
    Toggle,
    ViewErrors
} from "@umnburrow/core"
import useFormState from "@api/useFormState.ts"
import { createClub } from "@features/clubs/clubs.api.ts"
import type { ClubCategory, ClubLink, ClubPrivacy } from "@features/clubs/clubs.types.ts"
import Field from "@features/burrows/create/components/Field.tsx"
import ClubLinksEditor from "@features/clubs/components/ClubLinksEditor.tsx"
import { capitalizeFirstLetter } from "@api/util.ts"

type CreateClubFormState = {
    name: string
    displayName: string
    description: string
    links: Partial<Record<ClubLink, string>>
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
}

const initialFormState: CreateClubFormState = {
    name: "",
    displayName: "",
    description: "",
    links: {},
    category: "SOCIAL",
    privacy: "PUBLIC",
    requestToJoin: false
}

const INITIAL_ERRORS: string[] = []

type CreateClubModalProps = {
    open: boolean
    onClose: () => void
}

export default function CreateClubModal({
    open,
    onClose
}: CreateClubModalProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const { formState, errors, setErrors, updateField, verify, reset } =
        useFormState<CreateClubFormState>({
            initial: initialFormState,
            initialErrors: INITIAL_ERRORS,
            verifyEndpoint: "/clubs/verify"
        })
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            reset()
            setCurrentStep(1)
        }
    }, [open, reset])

    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
        if (currentStep === 1) {
            return await verify({
                name: formState.name,
                displayName: formState.displayName,
                description: formState.description
            })
        }

        return true
    }, [
        currentStep,
        formState.name,
        formState.displayName,
        formState.description,
        verify
    ])

    const handleNext = useCallback(async () => {
        if (!(await validateCurrentStep())) return
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1)
            setErrors([])
        }
    }, [currentStep, validateCurrentStep, setErrors])

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors([])
        }
    }, [currentStep, setErrors])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!(await validateCurrentStep())) return

        try {
            const club = await createClub({
                name: formState.name.trim(),
                displayName: formState.displayName.trim(),
                description: formState.description.trim(),
                links: formState.links,
                category: formState.category,
                privacy: formState.privacy,
                requestToJoin: formState.requestToJoin,
                members: []
            })

            setErrors([])
            void queryClient.invalidateQueries({ queryKey: ["myClubs"] })
            onClose()
            nav(`/club/${club.name}`)
        } catch (error) {
            if (Array.isArray(error)) {
                setErrors(error as string[])
            } else {
                setErrors([error as string])
            }
        }
    }

    function onClickSubmit() {
        const form = document.getElementById(
            "create-club-form"
        ) as HTMLFormElement
        form.requestSubmit()
    }

    const footer = useMemo(() => {
        return (
            <div className="flex w-full items-center justify-between">
                <div className="text-text/60 text-sm">
                    Step {currentStep} of 2
                </div>

                <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                        <Button
                            color="ERROR"
                            type="button"
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                    )}

                    {currentStep < 2 ? (
                        <Button
                            color="SUCCESS"
                            type="button"
                            onClick={handleNext}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            color="SUCCESS"
                            type="submit"
                            onClick={onClickSubmit}
                        >
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
                <ViewErrors errors={errors} clearErrors={() => setErrors([])} />

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="bg-card border-card-border rounded-lg border p-4">
                            <p className="text-text mb-2 text-sm font-medium">
                                Club Details
                            </p>
                            <p className="text-text/60 text-xs">
                                Give your club a name and description. The club
                                name is used in URLs and must be unique.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field label="Club Name" className="min-w-0">
                                <Input
                                    value={formState.name}
                                    onChange={(e) =>
                                        updateField(
                                            "name",
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/\s/g, "-")
                                        )
                                    }
                                    error={errors.length > 0}
                                    placeholder="my-club"
                                />
                            </Field>

                            <Field label="Display Name" className="min-w-0">
                                <Input
                                    value={formState.displayName}
                                    onChange={(e) =>
                                        updateField(
                                            "displayName",
                                            e.target.value
                                        )
                                    }
                                    placeholder="My Club"
                                />
                            </Field>

                            <div className="min-w-0 md:col-span-2">
                                <SelectInput
                                    text="Category"
                                    items={[
                                        "Sports",
                                        "Social",
                                        "Creative",
                                        "Educational"
                                    ]}
                                    value={capitalizeFirstLetter(
                                        formState.category.toLowerCase()
                                    )}
                                    onChange={(e) =>
                                        updateField(
                                            "category",
                                            e.target.value.toUpperCase() as ClubCategory
                                        )
                                    }
                                />
                            </div>

                            <Field
                                label="Description"
                                className="min-w-0 md:col-span-2"
                            >
                                <TextArea
                                    value={formState.description}
                                    onChange={(e) =>
                                        updateField(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    placeholder="What is your club about?"
                                />
                            </Field>
                        </div>

                        <Field label="Links">
                            <ClubLinksEditor
                                links={formState.links}
                                onChange={(links) => updateField("links", links)}
                            />
                        </Field>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="border-card-border bg-card rounded-lg border p-4">
                            <p className="text-text mb-2 text-sm font-medium">
                                Privacy Settings
                            </p>
                            <p className="text-text/60 text-xs">
                                Control who can see and join your club. You can
                                change these settings later.
                            </p>
                        </div>

                        <div className="min-w-0">
                            <SelectInput
                                text="Club Privacy"
                                remark="Public: visible to everyone &bull; Unlisted: only accessible via link &bull; Private: invite-only"
                                items={["Public", "Unlisted", "Private"]}
                                value={capitalizeFirstLetter(
                                    formState.privacy.toLowerCase()
                                )}
                                onChange={(e) =>
                                    updateField(
                                        "privacy",
                                        e.target.value.toUpperCase() as ClubPrivacy
                                    )
                                }
                            />
                        </div>

                        <div className="min-w-0 border-t border-neutral-200 pt-4">
                            <Toggle
                                title="Require approval to join"
                                description="When enabled, users must request to join and wait for approval from an administrator or moderator"
                                checked={formState.requestToJoin}
                                onChange={(checked) =>
                                    updateField("requestToJoin", checked)
                                }
                            />
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    )
}
