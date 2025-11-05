import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import type {
    GroupMeeting,
    SubmittedGroupMeeting
} from "../../groups/groups.types.ts"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Input, Modal, TextArea } from "@umnburrow/core"

/**
 * {@link StudyGroupModal}
 */
type StudyGroupModalProps = {
    open: boolean
    onClose: () => void
    mode?: "create" | "update"
    meeting?: GroupMeeting
    modalTitle?: string
    onSubmit: (payload: SubmittedGroupMeeting) => Promise<unknown>
}

/**
 * Convert a HH:MM into milliseconds.
 *
 * @param dateMs The current date in milliseconds.
 * @param time The HH:MM date.
 */
function addTime(dateMs: number, time: string): number {
    const timeSpl = time.split(":")

    return dateMs + +timeSpl[0] * 60 * 60 * 1000 + +timeSpl[1] * 60 * 1000
}

/**
 * Manages a study group, whether it be creating or updating.
 *
 * @param open When this modal is open.
 * @param onClose When this modal is closed.
 * @param mode Whether it's creating or updating.
 * @param meeting The meeting (if updating)
 * @param modalTitle The title {@link mode}.
 * @param onSubmit When the modal is submitted.
 * @constructor
 */
export default function StudyGroupModal({
    open,
    onClose,
    mode = "create",
    meeting,
    modalTitle,
    onSubmit
}: StudyGroupModalProps) {
    const nav = useNavigate()

    const queryClient = useQueryClient()
    const firstFieldRef = useRef<HTMLInputElement>(null)

    const [title, setTitle] = useState("")
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [location, setLocation] = useState("")
    const [capacity, setCapacity] = useState<number | "">("")
    const [tags, setTags] = useState<string>("")
    const [description, setDescription] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [serverErrors, setServerErrors] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            setErrors({})
            setServerErrors([])

            // if updating and a meeting is provided
            if (mode === "update" && meeting) {
                setTitle(meeting.title ?? "")
                setLocation(meeting.location ?? "")
                setCapacity(
                    meeting.capacity && meeting.capacity > 0
                        ? meeting.capacity
                        : ""
                )
                setTags(
                    Array.isArray(meeting.tags) ? meeting.tags.join(", ") : ""
                )
                setDescription(meeting.description ?? "")

                // date
                const start = new Date(meeting.beginningTime)
                const end = new Date(meeting.endTime)
                const yyyy = start.getFullYear()
                const mm = String(start.getMonth() + 1).padStart(2, "0")
                const dd = String(start.getDate()).padStart(2, "0")
                setDate(`${yyyy}-${mm}-${dd}`)

                // start time
                const hhStart = String(start.getHours()).padStart(2, "0")
                const minStart = String(start.getMinutes()).padStart(2, "0")
                setStartTime(`${hhStart}:${minStart}`)

                // end time
                const hhEnd = String(end.getHours()).padStart(2, "0")
                const minEnd = String(end.getMinutes()).padStart(2, "0")
                setEndTime(`${hhEnd}:${minEnd}`)
            } else {
                setTitle("")
                setLocation("")
                setCapacity("")
                setTags("")
                setDescription("")
                setDate("")
                setStartTime("")
                setEndTime("")
            }

            setTimeout(() => firstFieldRef.current?.focus(), 50)
        }
    }, [open, mode, meeting])

    function applyServerErrors(errs: string[]) {
        setServerErrors(errs)
        const fieldMap: Record<string, string> = {}
        errs.forEach((msg) => {
            // Try to parse patterns like "field: message" or "field = message"
            const m = msg.match(/^\s*([A-Za-z][\w.-]*)\s*[:=-]\s*(.+)$/)
            if (m) {
                const field = m[1]
                const text = m[2]
                fieldMap[field] = text
            }
        })
        if (Object.keys(fieldMap).length > 0) {
            setErrors((prev) => ({ ...prev, ...fieldMap }))
        }
    }

    // pre validate before server
    function validateInput(): boolean {
        const next: Record<string, string> = {}
        if (!title.trim()) next.title = "Required"
        if (!date) next.date = "Required"
        if (!startTime) next.startTime = "Required"
        if (!endTime) next.endTime = "Required"
        if (!location.trim()) next.location = "Required"
        if (startTime && endTime && startTime >= endTime)
            next.endTime = "End must be after start"

        setErrors(next)

        return Object.keys(next).length === 0
    }

    // on submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // pre validate
        if (!validateInput()) return

        const dateMs = new Date(`${date}T00:00:00-05:00`).getTime()

        const payload: SubmittedGroupMeeting = {
            kind: "STUDY" as const,
            title: title.trim(),
            location: location.trim(),
            capacity: typeof capacity === "number" ? capacity : 0,
            tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            description: description.trim() || "",
            beginningTime: addTime(dateMs, startTime),
            endTime: addTime(dateMs, endTime)
        }

        const response = await onSubmit(payload)

        // no matter what, this means there's errors in the response
        if (Array.isArray(response)) {
            applyServerErrors(response as string[])
            return
        }

        // if updating, update query data and close
        if (mode === "update" && meeting) {
            setServerErrors([])
            onClose()

            queryClient.setQueryData([`meeting`, meeting.id], (old: any) => {
                console.log("%o", old)
                return {
                    ...old,
                    meeting: {
                        ...old.meeting,
                        ...payload
                    }
                }
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

            const updated = response as GroupMeeting
            nav(`/meeting/${updated.id}`)

            onClose()
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                modalTitle ??
                (mode === "update"
                    ? "Update Study Group"
                    : "Create a Study Group")
            }
            footer={
                <div className="flex items-center justify-end gap-3">
                    <Button color="ERROR" type="button" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        color="SUCCESS"
                        type="submit"
                        onClick={onClickSubmit}
                    >
                        {mode === "update" ? "Save Changes" : "Create"}
                    </Button>
                </div>
            }
            widthClass="max-w-2xl"
        >
            <form id="study-form" onSubmit={handleSubmit}>
                {/* errors.. uh oh! */}
                {serverErrors.length > 0 && (
                    <div className="mx-0 mt-0 mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                        <p className="mb-1 font-medium">
                            Please fix the following:
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            {serverErrors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="text-text/60 mt-0.5 mb-4 text-sm leading-6">
                    {mode === "update"
                        ? "Modify the details below and save your changes."
                        : "Fill details below and publish your meeting."}
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* title of the session */}
                    <Field
                        label="Title"
                        error={errors.title}
                        className="min-w-0"
                    >
                        <Input
                            ref={firstFieldRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            error={errors.title !== undefined}
                            placeholder="PHYS 1301W Final"
                        />
                    </Field>

                    {/* location of the session */}
                    <Field label="Location" error={errors.location}>
                        <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            error={errors.location !== undefined}
                            placeholder="Hall & Room"
                        />
                    </Field>

                    {/* capacity */}
                    <Field label="Max Participants (optional)">
                        <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={capacity}
                            onChange={(e) => {
                                const value = e.target.value
                                if (value === "") return setCapacity("")
                                const num = Number(value.replace(/\D/g, ""))
                                if (!Number.isNaN(num)) setCapacity(num)
                            }}
                            placeholder="5"
                        />
                    </Field>

                    {/* tags*/}
                    <Field label="Tags (comma separated)" className="min-w-0">
                        <Input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="PHYS, FINAL, etc."
                        />
                    </Field>

                    {/* description */}
                    <Field
                        label="Description"
                        className="min-w-0 md:col-span-2"
                    >
                        <TextArea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What're you studying? Who are you looking for?"
                        />
                    </Field>

                    {/* date */}
                    <Field label="Date" error={errors.date} className="min-w-0">
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            error={errors.date !== undefined}
                        />
                    </Field>

                    {/* time */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* start */}
                        <Field
                            label="Start"
                            error={errors.startTime}
                            className="min-w-0"
                        >
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                error={errors.startTime !== undefined}
                            />
                        </Field>

                        {/* end */}
                        <Field
                            label="End"
                            error={errors.endTime}
                            className="min-w-0"
                        >
                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                error={errors.endTime !== undefined}
                            />
                        </Field>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

/**
 * An individual field on the modal.
 *
 * @param label The label for the field.
 * @param error If there's an error.
 * @param children The input itself.
 * @param className Additional styling.
 * @constructor
 */
function Field({
    label,
    error,
    children,
    className = ""
}: {
    label: string
    error?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={className}>
            <label className="text-text/80 mb-1 block text-[13px] font-medium tracking-wide">
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
            )}
        </div>
    )
}
