import { Input, TimeInput } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import { Time } from "@internationalized/date"
import type { TimeValue } from "react-aria-components"

/**
 * Due date step for creating a project.
 * For projects, we only need a due date (not start/end times).
 *
 * @see CreateProjectBurrowModal
 */
export default function DueDateStep({
    formState,
    updateField
}: CreateStepProps) {
    return (
        <div className="space-y-6">
            <div className="border-border bg-hero/50 rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Project Timeline
                </p>
                <p className="text-text/60 text-xs">
                    Set the deadline for when this project needs to be
                    completed.
                </p>
            </div>

            {/* due date */}
            <Field
                label="Due Date"
                className="min-w-0"
            >
                <Input
                    type="date"
                    value={formState.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                />
            </Field>

            {/* optional due time */}
            <TimeInput
                text="Due Time (optional)"
                value={
                    formState.endTime
                        ? (() => {
                              const [hours, minutes] =
                                  formState.endTime.split(":")
                              return new Time(
                                  parseInt(hours),
                                  parseInt(minutes)
                              )
                          })()
                        : null
                }
                onChange={(value: TimeValue | null) => {
                    if (value) {
                        const hours = String(value.hour).padStart(2, "0")
                        const minutes = String(value.minute).padStart(2, "0")
                        updateField("endTime", `${hours}:${minutes}`)
                    } else {
                        updateField("endTime", "")
                    }
                }}
            />
        </div>
    )
}
