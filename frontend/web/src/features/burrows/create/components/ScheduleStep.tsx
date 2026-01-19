import { Input, TimeInput } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import { Time } from "@internationalized/date"
import type { TimeValue } from "react-aria-components"

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
        <div className="space-y-6">
            <div className="border-border bg-hero/50 rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Schedule Your Burrow
                </p>
                <p className="text-text/60 text-xs">
                    Choose when your Burrow will take place.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* date */}
                <Field
                    label="Burrow Date"
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
                    <TimeInput
                        value={
                            formState.beginningTime
                                ? (() => {
                                      const [hours, minutes] =
                                          formState.beginningTime.split(":")
                                      return new Time(
                                          parseInt(hours),
                                          parseInt(minutes)
                                      )
                                  })()
                                : null
                        }
                        onChange={(value: TimeValue | null) => {
                            if (value) {
                                const hours = String(value.hour).padStart(
                                    2,
                                    "0"
                                )
                                const minutes = String(value.minute).padStart(
                                    2,
                                    "0"
                                )
                                updateField(
                                    "beginningTime",
                                    `${hours}:${minutes}`
                                )
                            } else {
                                updateField("beginningTime", "")
                            }
                        }}
                        error={errors.endTime !== undefined}
                    />
                </Field>

                {/* end time */}
                <Field
                    label="End Time"
                    error={errors.endTime}
                    className="min-w-0"
                >
                    <TimeInput
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
                                const hours = String(value.hour).padStart(
                                    2,
                                    "0"
                                )
                                const minutes = String(value.minute).padStart(
                                    2,
                                    "0"
                                )
                                updateField("endTime", `${hours}:${minutes}`)
                            } else {
                                updateField("endTime", "")
                            }
                        }}
                        error={errors.endTime !== undefined}
                    />
                </Field>
            </div>
        </div>
    )
}
