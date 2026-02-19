import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, ViewErrors } from "@umnburrow/core"
import useFormState from "@api/useFormState.ts"
import ScheduleStep from "@features/burrows/create/components/ScheduleStep.tsx"
import {
    initialFormState,
    type SubmittedBurrow,
    type SubmittedStudyEventBurrow,
    type SubmittedBurrowFormState
} from "@features/burrows/create/create.types.ts"
import PrivacyStep from "@features/burrows/create/components/PrivacyStep.tsx"
import InfoStep from "@features/burrows/create/components/InfoStep.tsx"
import { addTime } from "@api/util.ts"

const INITIAL_ERRORS: Record<string, string> = {}

/**
 * {@link CreateStudyBurrowModal}
 */
type BurrowModalProps = {
    open: boolean
    onClose: () => void
    mode?: "create" | "update"
    burrow?: Burrow
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
    burrow,
    modalTitle,
    onSubmit
}: BurrowModalProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const { formState, setFormState, errors, setErrors, updateField, verify, reset } =
        useFormState<SubmittedBurrowFormState, Record<string, string>>({
            initial: initialFormState,
            initialErrors: INITIAL_ERRORS,
            verifyEndpoint: "/burrows/verify"
        })
    const [serverErrors, setServerErrors] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            setServerErrors([])
            setCurrentStep(1)

            // if updating and a burrow is provided
            if (mode === "update" && burrow) {
                const start = new Date(burrow.beginningTime)
                const end = new Date(burrow.endTime)

                const yyyy = start.getFullYear()
                const mm = String(start.getMonth() + 1).padStart(2, "0")
                const dd = String(start.getDate()).padStart(2, "0")
                const hhStart = String(start.getHours()).padStart(2, "0")
                const minStart = String(start.getMinutes()).padStart(2, "0")
                const hhEnd = String(end.getHours()).padStart(2, "0")
                const minEnd = String(end.getMinutes()).padStart(2, "0")

                setFormState({
                    kind: "STUDY",
                    title: burrow.title ?? "",
                    location: burrow.location ?? "",
                    capacity:
                        burrow.capacity && burrow.capacity > 0
                            ? burrow.capacity
                            : 0,
                    tags: Array.isArray(burrow.tags)
                        ? burrow.tags.join(", ")
                        : "",
                    description: burrow.description ?? "",
                    visibility: burrow.visibility ?? "PUBLIC",
                    requestToJoin: burrow.requestToJoin ?? false,
                    date: `${yyyy}-${mm}-${dd}`,
                    beginningTime: `${hhStart}:${minStart}`,
                    endTime: `${hhEnd}:${minEnd}`,
                    reoccurring: burrow.reoccurring
                })
            } else {
                reset()
            }
        }
    }, [open, mode, burrow, reset, setFormState])

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

    // validate current step via server
    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
        if (currentStep === 1) {
            return await verify({
                title: formState.title,
                description: formState.description,
                location: formState.location
            })
        } else if (currentStep === 3) {
            const dateMs = formState.date
                ? new Date(`${formState.date}T00:00:00-06:00`).getTime()
                : 0

            return await verify({
                beginningTime: formState.beginningTime
                    ? addTime(dateMs, formState.beginningTime)
                    : 0,
                endTime: formState.endTime
                    ? addTime(dateMs, formState.endTime)
                    : 0,
                reoccurring: formState.reoccurring
            })
        }

        return true
    }, [currentStep, formState, verify])

    // navigate to next step
    const handleNext = useCallback(async () => {
        if (!(await validateCurrentStep())) return
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1)
            setErrors({})
        }
    }, [currentStep, validateCurrentStep, setErrors])

    // navigate to previous step
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors({})
        }
    }, [currentStep, setErrors])

    // on submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // pre validate current step (should be step 3 at this point)
        if (!(await validateCurrentStep())) return

        const dateMs = new Date(`${formState.date}T00:00:00-06:00`).getTime()

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
            requestToJoin: formState.requestToJoin,
            reoccurring: formState.reoccurring
        }

        try {
            const response = await onSubmit(payload)

            // if updating, update query data and close
            if (mode === "update" && burrow) {
                setServerErrors([])
                onClose()

                void queryClient.invalidateQueries({
                    queryKey: ["burrow", burrow.id]
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
                        kind="STUDY"
                    />
                )}

                {/* privacy */}
                {currentStep === 2 && (
                    <PrivacyStep
                        errors={errors}
                        formState={formState}
                        updateField={updateField}
                        kind="STUDY"
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
