import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, ViewErrors } from "@umnburrow/core"
import DueDateStep from "@features/burrows/create/components/project/DueDateStep.tsx"
import {
    initialFormState,
    type SubmittedBurrow,
    type SubmittedProjectBurrow,
    type SubmittedBurrowFormState
} from "@features/burrows/create/create.types.ts"
import MembersStep from "@features/burrows/create/components/project/MembersStep.tsx"
import InfoStep from "@features/burrows/create/components/project/InfoStep.tsx"
import { addTime } from "@api/util.ts"

/**
 * {@link CreateProjectBurrowModal}
 */
type BurrowModalProps = {
    open: boolean
    onClose: () => void
    mode?: "create" | "update"
    meeting?: Burrow
    modalTitle?: string
    onSubmit: (payload: SubmittedBurrow) => Promise<unknown>
}

/**
 * Manages a Project Burrow.
 *
 * This includes functionality to both create and edit a Project.
 * Projects don't require start times, only due dates, and don't have a privacy step.
 *
 * @param open When this modal is open.
 * @param onClose When this modal is closed.
 * @param mode Whether it's creating or updating.
 * @param meeting The meeting (if updating)
 * @param modalTitle The title {@link mode}.
 * @param onSubmit When the modal is submitted.
 * @constructor
 */
export default function CreateProjectBurrowModal({
    open,
    onClose,
    mode = "create",
    meeting,
    modalTitle,
    onSubmit
}: BurrowModalProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const [formState, setFormState] =
        useState<SubmittedBurrowFormState>(initialFormState)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [serverErrors, setServerErrors] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            setErrors({})
            setServerErrors([])
            setCurrentStep(1)

            // if updating and a meeting is provided
            if (mode === "update" && meeting) {
                const dueDate = new Date(meeting.endTime)

                const yyyy = dueDate.getFullYear()
                const mm = String(dueDate.getMonth() + 1).padStart(2, "0")
                const dd = String(dueDate.getDate()).padStart(2, "0")
                const hh = String(dueDate.getHours()).padStart(2, "0")
                const min = String(dueDate.getMinutes()).padStart(2, "0")

                setFormState({
                    kind: "PROJECT",
                    title: meeting.title ?? "",
                    location: meeting.location ?? "",
                    capacity: 10, // Fixed at 10 members
                    tags: Array.isArray(meeting.tags)
                        ? meeting.tags.join(", ")
                        : "", // Repurposed for member usernames
                    description: meeting.description ?? "",
                    visibility: "PUBLIC", // Projects are always public
                    requestToJoin: false,
                    date: `${yyyy}-${mm}-${dd}`,
                    beginningTime: "", // Not used for projects
                    endTime: `${hh}:${min}`
                })
            } else {
                setFormState({
                    ...initialFormState,
                    kind: "PROJECT",
                    visibility: "PUBLIC",
                    capacity: 10, // Fixed at 10 members
                    tags: "" // Repurposed for member usernames
                })
            }
        }
    }, [open, mode, meeting])

    function applyServerErrors(errs: string[]) {
        setServerErrors(errs)
        const fieldMap: Record<string, string> = {}
        errs.forEach((msg) => {
            const m = msg.match(/^\s*([A-Za-z][\w.-]*)\s*[:=-]\s*(.+)$/)

            if (m) {
                const field = m[1]
                fieldMap[field] = m[2]
            }
        })

        if (Object.keys(fieldMap).length > 0) {
            setErrors((prev) => ({ ...prev, ...fieldMap }))
        }
    }

    // helper to update form state
    const updateField = useCallback(
        <K extends keyof SubmittedBurrowFormState>(
            field: K,
            value: SubmittedBurrowFormState[K]
        ) => {
            setFormState((prev) => ({ ...prev, [field]: value }))
        },
        []
    )

    // validate current step
    const validateCurrentStep = useCallback((): boolean => {
        const next: Record<string, string> = {}

        if (currentStep === 1) {
            if (!formState.title.trim()) next.title = "Required"
        } else if (currentStep === 3) {
            if (!formState.date) next.date = "Required"
        }

        setErrors(next)
        return Object.keys(next).length === 0
    }, [currentStep, formState])

    // navigate to next step
    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1)
            setErrors({})
        }
    }, [currentStep, validateCurrentStep])

    // navigate to previous step
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors({})
        }
    }, [currentStep])

    // on submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // pre validate current step (should be step 3 at this point)
        if (!validateCurrentStep()) return

        const dateMs = new Date(`${formState.date}T00:00:00-05:00`).getTime()

        // For projects, end time is the due date/time
        const dueTime = formState.endTime
            ? addTime(dateMs, formState.endTime)
            : dateMs + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 // End of day if no time specified

        // Parse member user IDs from tags field (JSON array of member objects)
        let memberIDs: string[] = []
        try {
            // Try parsing as JSON first (new format)
            const members = JSON.parse(formState.tags)
            memberIDs = members.map((m: { id: string }) => m.id)
        } catch {
            // Fallback to old format (comma-separated IDs)
            memberIDs = formState.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
        }

        const payload: SubmittedProjectBurrow = {
            kind: "PROJECT" as const,
            name: formState.title.trim(),
            objective: formState.description.trim() || "",
            className: formState.location.trim() || "",
            teamMembers: memberIDs, // Array of user IDs
            dueDate: dueTime
        }

        try {
            const response = await onSubmit(payload)

            // if updating, update query data and close
            if (mode === "update" && meeting) {
                setServerErrors([])
                onClose()

                queryClient.setQueryData(
                    [`meeting`, meeting.id],
                    (old: unknown) => {
                        return {
                            ...(old as Record<string, unknown>),
                            meeting: {
                                ...((old as Record<string, unknown>)
                                    .meeting as Record<string, unknown>),
                                ...payload
                            }
                        }
                    }
                )

                return
            }

            // if creating, go to the new project
            if (
                response &&
                typeof response === "object" &&
                !Array.isArray(response) &&
                "id" in response
            ) {
                setServerErrors([])

                const updated = response as Burrow
                nav(`/${updated.id}`)

                onClose()
                return
            }
        } catch (error) {
            if (Array.isArray(error)) {
                applyServerErrors(error as string[])
            } else {
                applyServerErrors([error as string])
            }

            return
        }

        applyServerErrors([
            "Unknown error submitting project. Please try again."
        ])
    }

    // submit button handler
    function onClickSubmit() {
        const form = document.getElementById("project-form") as HTMLFormElement

        form.requestSubmit()
    }

    // render footer based on current step
    const footer = useMemo(() => {
        return (
            <div className="flex w-full items-center justify-between">
                <div className="text-text/60 text-sm">
                    Step {currentStep} of 3
                </div>

                <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                        <Button
                            color="SECONDARY"
                            type="button"
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                    )}

                    {currentStep < 3 ? (
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
                            {mode === "update" ? "Save Changes" : "Create"}
                        </Button>
                    )}
                </div>
            </div>
        )
    }, [currentStep, handleBack, handleNext, mode])

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                modalTitle ??
                (mode === "update" ? "Update Project" : "Create Project")
            }
            footer={footer}
            widthClass="md:min-w-xl max-w-xl"
        >
            <form id="project-form" onSubmit={handleSubmit}>
                {/* errors.. uh oh! */}
                <ViewErrors
                    errors={serverErrors}
                    clearErrors={() => setServerErrors([])}
                />

                {/* basic info */}
                {currentStep === 1 && (
                    <InfoStep
                        errors={errors}
                        formState={formState}
                        updateField={updateField}
                    />
                )}

                {/* team members */}
                {currentStep === 2 && (
                    <MembersStep
                        errors={errors}
                        formState={formState}
                        updateField={updateField}
                    />
                )}

                {/* due date */}
                {currentStep === 3 && (
                    <DueDateStep
                        errors={errors}
                        formState={formState}
                        updateField={updateField}
                    />
                )}
            </form>
        </Modal>
    )
}
