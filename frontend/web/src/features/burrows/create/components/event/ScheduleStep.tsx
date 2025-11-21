import { Input } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"

/**
 * Schedule step for creating an event.
 *
 * @see CreateEventBurrowModal
 *
 * @author AJ Kneisl
 */
export default function ScheduleStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* date */}
            <Field
                label="Event Date"
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
            <Field label="End Time" error={errors.endTime} className="min-w-0">
                <Input
                    type="time"
                    value={formState.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    error={errors.endTime !== undefined}
                />
            </Field>
        </div>
    )
}
