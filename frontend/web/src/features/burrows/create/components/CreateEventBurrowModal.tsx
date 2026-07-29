import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, ViewErrors } from "@umnburrow/core"
import useFormState from "@api/useFormState.ts"
import ScheduleStep from "@features/burrows/create/components/ScheduleStep.tsx"
import {
    defaultTimes,
    initialFormState,
    type SubmittedBurrow,
    type SubmittedStudyEventBurrow,
    type SubmittedBurrowFormState
} from "@features/burrows/create/create.types.ts"
import PrivacyStep from "@features/burrows/create/components/PrivacyStep.tsx"
import InfoStep from "@features/burrows/create/components/InfoStep.tsx"
import { addTime } from "@api/util.ts"

const INITIAL_ERRORS: string[] = []

/**
 * {@link CreateEventBurrowModal}
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
 * Manages an Event Burrow.
 *
 * This includes functionality to both create and edit an Event.
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
export default function CreateEventBurrowModal({
    open,
    onClose,
    mode = "create",
    meeting,
    modalTitle,
    onSubmit
}: BurrowModalProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const { formState, setFormState, errors, setErrors, updateField, verify, reset } =
        useFormState<SubmittedBurrowFormState, string[]>({
            initial: initialFormState,
            initialErrors: INITIAL_ERRORS,
            verifyEndpoint: "/burrows/verify"
        })
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        if (open) {
            setErrors([])
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
                    kind: "EVENT",
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
                    endTime: `${hhEnd}:${minEnd}`,
                    reoccurring: -1
                })
            } else {
                reset()
                setFormState((prev) => ({ ...prev, ...defaultTimes(), kind: "EVENT" }))
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
                title: formState.title,
                description: formState.description,
                location: formState.location,
                capacity: formState.capacity,
                tags: formState.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            })
        } else if (currentStep === 3) {
            const dateMs = formState.date
                ? new Date(`${formState.date}T00:00:00`).getTime()
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

        // pre validate current step (should be step 3 at this point)
        if (!(await validateCurrentStep())) return

        const dateMs = new Date(`${formState.date}T00:00:00`).getTime()

        const payload: SubmittedStudyEventBurrow = {
            kind: "EVENT" as const,
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
            if (mode === "update" && meeting) {
                setErrors([])
                onClose()

                queryClient.invalidateQueries({
                    queryKey: ["burrow", meeting.id]
                })

                return
            }

            // if creating, go to the new event
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

        applyServerErrors(["Unknown error submitting event. Please try again."])
    }

    // submit button handler
    function onClickSubmit() {
        const form = document.getElementById("event-form") as HTMLFormElement

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
                (mode === "update" ? "Update Event" : "Create Event")
            }
            footer={footer}
            widthClass="md:min-w-xl max-w-xl"
        >
            <form id="event-form" onSubmit={handleSubmit}>
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
                        kind="EVENT"
                    />
                )}

                {/* privacy */}
                {currentStep === 2 && (
                    <PrivacyStep
                        formState={formState}
                        updateField={updateField}
                        kind="EVENT"
                    />
                )}

                {/* schedule */}
                {currentStep === 3 && (
                    <ScheduleStep
                        formState={formState}
                        updateField={updateField}
                    />
                )}
            </form>
        </Modal>
    )
}
