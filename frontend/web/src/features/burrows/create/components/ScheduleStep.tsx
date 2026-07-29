import { Input, SelectInput, TimeInput, Toggle } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import { Time } from "@internationalized/date"
import type { TimeValue } from "react-aria-components"
import { useState } from "react"
import { DAILY, MONTHLY, NOT_REOCCURRING, WEEKLY } from "@features/burrows/burrows.types.tsx"

type Timeframe = "Daily" | "Weekly" | "Monthly"

/**
 * Schedule step for creating an event.
 *
 * @see CreateEventBurrowModal
 *
 * @author AJ Kneisl
 */
export default function ScheduleStep({
    formState,
    updateField
}: CreateStepProps) {
    const [reoccurring, setReoccurring] = useState(formState.reoccurring !== NOT_REOCCURRING)
    const [timeframe, setTimeframe] = useState("Weekly" as Timeframe)
    const [endTimeTouched, setEndTimeTouched] = useState(false)

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-card-border bg-card p-4">
                <p className="mb-2 text-sm font-medium text-text">
                    Schedule Your Burrow
                </p>
                <p className="text-xs text-text/60">
                    Choose when your Burrow will take place.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* date */}
                <Field
                    label="Burrow Date"
                    className="min-w-0 md:col-span-2"
                >
                    <Input
                        type="date"
                        value={formState.date}
                        onChange={(e) => updateField("date", e.target.value)}
                    />
                </Field>

                {/* start time */}
                <Field
                    label="Start Time"
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

                                if (!endTimeTouched) {
                                    const endHour = value.hour + 1
                                    const endTime =
                                        endHour >= 24
                                            ? "23:59"
                                            : `${String(endHour).padStart(2, "0")}:${minutes}`
                                    updateField("endTime", endTime)
                                }
                            } else {
                                updateField("beginningTime", "")
                            }
                        }}
                    />
                </Field>

                {/* end time */}
                <Field
                    label="End Time"
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
                            setEndTimeTouched(true)
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
                    />
                </Field>
            </div>

            {/* reoccurring burrow */}
            <Toggle
                title="Reoccurring Burrow"
                description={"Should this Burrow be reoccurring?"}
                checked={reoccurring}
                onChange={(enabled) => {
                    setReoccurring(enabled)

                    if (enabled) {
                        switch (timeframe) {
                            case "Daily":
                                updateField("reoccurring", DAILY)
                                return
                            case "Weekly":
                                updateField("reoccurring", WEEKLY)
                                return
                            case "Monthly":
                                updateField("reoccurring", MONTHLY)
                                return
                        }
                    } else {
                        updateField("reoccurring", NOT_REOCCURRING)
                    }
                }}
            />

            <div
                className={`grid transition-all duration-300 ease-in-out ${reoccurring ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
                <div className="overflow-hidden">
                    <SelectInput
                        text="How Often?"
                        value={timeframe}
                        onChange={(ev) => {
                            setTimeframe(ev.currentTarget.value as Timeframe)

                            switch (ev.currentTarget.value as Timeframe) {
                                case "Daily":
                                    updateField("reoccurring", DAILY)
                                    return
                                case "Weekly":
                                    updateField("reoccurring", WEEKLY)
                                    return
                                case "Monthly":
                                    updateField("reoccurring", MONTHLY)
                                    return
                            }
                        }}
                        items={["Daily", "Weekly", "Monthly"]}
                    />
                </div>
            </div>
        </div>
    )
}
