import { Input } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"

/**
 * A step in the Burrow process.
 *
 * @see BurrowModal
 *
 * @author AJ Kneisl
 */
export default function ScheduleStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
    return (
        <div className="space-y-6">
            <div className="border-border bg-hero/50 rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Schedule Your Session
                </p>
                <p className="text-text/60 text-xs">
                    Pick a date and time for your study session. Make sure to
                    choose a time that works for your schedule.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* date */}
                <Field
                label="Date"
                error={errors.date}
                className="min-w-0 md:col-span-2"
            >
                <Input
                    type="date"
                    value={formState.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    error={errors.date !== undefined}
                />
            </Field>

            {/* start time */}
            <Field
                label="Start Time"
                error={errors.startTime}
                className="min-w-0"
            >
                <Input
                    type="time"
                    value={formState.beginningTime}
                    onChange={(e) =>
                        updateField("beginningTime", e.target.value)
                    }
                    error={errors.startTime !== undefined}
                />
            </Field>

                {/* end time */}
                <Field
                    label="End Time"
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
            </div>
        </div>
    )
}
