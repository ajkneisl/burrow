import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, ViewErrors } from "@umnburrow/core"
import ScheduleStep from "@features/burrows/create/components/study/ScheduleStep.tsx"
import {
    initialFormState,
    type SubmittedBurrow,
    type SubmittedStudyEventBurrow,
    type SubmittedBurrowFormState
} from "@features/burrows/create/create.types.ts"
import PrivacyStep from "@features/burrows/create/components/study/PrivacyStep.tsx"
import InfoStep from "@features/burrows/create/components/study/InfoStep.tsx"
import { addTime } from "@api/util.ts"

/**
 * {@link CreateStudyBurrowModal}
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
 * Manages a Burrow.
 *
 * This includes functionality to both create and edit a Burrow.
 *
 * @param open When this modal is open.
 * @param onClose When this modal is closed.
 * @param mode Whether it's creating or updating.
 * @param meeting The meeting (if updating)
 * @param modalTitle The title {@link mode}.
 * @param onSubmit When the modal is submitted.
 *
 * @author AJ Kneisl
 */
export default function CreateStudyBurrowModal({
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
                const start = new Date(meeting.beginningTime)
                const end = new Date(meeting.endTime)

                const yyyy = start.getFullYear()
                const mm = String(start.getMonth() + 1).padStart(2, "0")
                const dd = String(start.getDate()).padStart(2, "0")
                const hhStart = String(start.getHours()).padStart(2, "0")
                const minStart = String(start.getMinutes()).padStart(2, "0")
                const hhEnd = String(end.getHours()).padStart(2, "0")
                const minEnd = String(end.getMinutes()).padStart(2, "0")

                setFormState({
                    kind: "STUDY",
                    title: meeting.title ?? "",
                    location: meeting.location ?? "",
                    capacity:
                        meeting.capacity && meeting.capacity > 0
                            ? meeting.capacity
                            : 0,
                    tags: Array.isArray(meeting.tags)
                        ? meeting.tags.join(", ")
                        : "",
                    description: meeting.description ?? "",
                    visibility: meeting.visibility ?? "PUBLIC",
                    requestToJoin: meeting.requestToJoin ?? false,
                    date: `${yyyy}-${mm}-${dd}`,
                    beginningTime: `${hhStart}:${minStart}`,
                    endTime: `${hhEnd}:${minEnd}`
                })
            } else {
                setFormState(initialFormState)
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
            if (!formState.location.trim()) next.location = "Required"
        } else if (currentStep === 3) {
            if (!formState.date) next.date = "Required"
            if (!formState.beginningTime) next.beginningTime = "Required"
            if (!formState.endTime) next.endTime = "Required"
            if (
                formState.beginningTime &&
                formState.endTime &&
                formState.beginningTime >= formState.endTime
            )
                next.endTime = "End must be after start"
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

        const payload: SubmittedStudyEventBurrow = {
            kind: "STUDY" as const,
            title: formState.title.trim(),
            location: formState.location.trim(),
            capacity: formState.capacity,
            tags: formState.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            description: formState.description.trim() || "",
            beginningTime: addTime(dateMs, formState.beginningTime),
            endTime: addTime(dateMs, formState.endTime),
            visibility: formState.visibility,
            requestToJoin: formState.requestToJoin
        }

        try {
            const response = await onSubmit(payload)

            // if updating, update query data and close
            if (mode === "update" && meeting) {
                setServerErrors([])
                onClose()

                void queryClient.invalidateQueries({
                    queryKey: ["burrow", meeting.id]
                })

                return
            }

            // if creating, go to the new meeting
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
            "Unknown error submitting meeting. Please try again."
        ])
    }

    // to be honest, this is kinda cheap.
    // the submit button got moved out the form eventually, so this is a workaround.
    function onClickSubmit() {
        const form = document.getElementById("study-form") as HTMLFormElement

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
                (mode === "update"
                    ? "Update Study Group"
                    : "Create Study Group")
            }
            footer={footer}
            widthClass="md:min-w-xl max-w-xl"
        >
            <form id="study-form" onSubmit={handleSubmit}>
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

                {/* privacy */}
                {currentStep === 2 && (
                    <PrivacyStep
                        errors={errors}
                        formState={formState}
                        updateField={updateField}
                    />
                )}

                {/* schedule */}
                {currentStep === 3 && (
                    <ScheduleStep
                        errors={errors}
                        formState={formState}
                        updateField={updateField}
                    />
                )}
            </form>
        </Modal>
    )
}
