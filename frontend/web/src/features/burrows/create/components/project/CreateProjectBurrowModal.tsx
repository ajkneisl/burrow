import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, ViewErrors } from "@umnburrow/core"
import useFormState from "@api/useFormState.ts"
import DueDateStep from "@features/burrows/create/components/project/DueDateStep.tsx"
import {
    defaultTimes,
    initialFormState,
    type SubmittedBurrow,
    type SubmittedProjectBurrow,
    type SubmittedBurrowFormState
} from "@features/burrows/create/create.types.ts"
import MembersStep from "@features/burrows/create/components/project/MembersStep.tsx"
import InfoStep from "@features/burrows/create/components/project/InfoStep.tsx"
import { addTime } from "@api/util.ts"

const INITIAL_ERRORS: string[] = []

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

    const {
        formState,
        setFormState,
        errors,
        setErrors,
        updateField,
        verify,
        reset
    } = useFormState<SubmittedBurrowFormState, string[]>({
        initial: initialFormState,
        initialErrors: INITIAL_ERRORS,
        verifyEndpoint: "/burrows/verify/project"
    })
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            setErrors([])
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
                    capacity: 10,
                    tags: Array.isArray(meeting.tags)
                        ? meeting.tags.join(", ")
                        : "",
                    description: meeting.description ?? "",
                    visibility: "PUBLIC",
                    requestToJoin: false,
                    date: `${yyyy}-${mm}-${dd}`,
                    beginningTime: "",
                    endTime: `${hh}:${min}`,
                    reoccurring: -1
                })
            } else {
                reset()
                setFormState((prev) => ({
                    ...prev,
                    ...defaultTimes(),
                    kind: "PROJECT",
                    visibility: "PUBLIC",
                    capacity: 10,
                    tags: ""
                }))
            }
        }
    }, [open, mode, meeting, reset, setFormState, setErrors])

    function applyServerErrors(errs: string[]) {
        setErrors(errs)
    }

    // validate current step via server
    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
        if (currentStep === 1) {
            return await verify({
                name: formState.title,
                objective: formState.description,
                className: formState.location
            })
        } else if (currentStep === 3) {
            const dateMs = formState.date
                ? new Date(`${formState.date}T00:00:00`).getTime()
                : 0

            const dueTime = formState.endTime
                ? addTime(dateMs, formState.endTime)
                : dateMs + 23 * 60 * 60 * 1000 + 59 * 60 * 1000

            return await verify({ dueDate: dueTime })
        }

        return true
    }, [currentStep, formState, verify])

    // navigate to next step
    const handleNext = useCallback(async () => {
        if (!(await validateCurrentStep())) return
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1)
            setErrors([])
        }
    }, [currentStep, validateCurrentStep, setErrors])

    // navigate to previous step
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors([])
        }
    }, [currentStep, setErrors])

    // on submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!(await validateCurrentStep())) return

        const dateMs = new Date(`${formState.date}T00:00:00`).getTime()

        const dueTime = formState.endTime
            ? addTime(dateMs, formState.endTime)
            : dateMs + 23 * 60 * 60 * 1000 + 59 * 60 * 1000

        let memberIDs: string[]
        try {
            const members = JSON.parse(formState.tags)
            memberIDs = members.map((m: { id: string }) => m.id)
        } catch {
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
                setErrors([])
                onClose()

                void queryClient.invalidateQueries({
                    queryKey: ["burrow", meeting.id]
                })

                return
            }

            // if creating, go to the new project
            if (
                response &&
                typeof response === "object" &&
                !Array.isArray(response) &&
                "id" in response
            ) {
                setErrors([])

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
                <div className="text-sm text-text/60">
                    Step {currentStep} of 3
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
                    errors={errors}
                    clearErrors={() => setErrors([])}
                />

                {/* basic info */}
                {currentStep === 1 && (
                    <InfoStep
                        formState={formState}
                        updateField={updateField}
                    />
                )}

                {/* team members */}
                {currentStep === 2 && (
                    <MembersStep
                        formState={formState}
                        updateField={updateField}
                        mode={mode}
                    />
                )}

                {/* due date */}
                {currentStep === 3 && (
                    <DueDateStep
                        formState={formState}
                        updateField={updateField}
                    />
                )}
            </form>
        </Modal>
    )
}
