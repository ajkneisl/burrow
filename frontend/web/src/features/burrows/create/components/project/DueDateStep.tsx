import { Input } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"

/**
 * Due date step for creating a project.
 * For projects, we only need a due date (not start/end times).
 *
 * @see CreateProjectBurrowModal
 */
export default function DueDateStep({
    errors,
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
                error={errors.date}
                className="min-w-0"
            >
                <Input
                    type="date"
                    value={formState.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    error={errors.date !== undefined}
                    min={new Date().toISOString().split("T")[0]}
                />
            </Field>

            {/* optional due time */}
            <Field
                label="Due Time (optional)"
                error={errors.endTime}
                className="min-w-0"
            >
                <Input
                    type="time"
                    value={formState.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    error={errors.endTime !== undefined}
                />
            </Field>

            <div className="border-info/30 bg-info/10 rounded-lg border p-4">
                <p className="text-info text-xs">
                    💡 <strong>Tip:</strong> The due time is optional. If you
                    don't specify a time, the project will be due at the end of
                    the selected date.
                </p>
            </div>
        </div>
    )
}
