import Field from "@features/burrows/create/components/Field.tsx"
import { Input, TextArea } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import LocationSelector from "@features/burrows/components/LocationSelector.tsx"

/**
 * Info step for creating an event.
 *
 * @see CreateEventBurrowModal
 *
 * @author AJ Kneisl
 */
export default function InfoStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {

    return (
        <div className="space-y-6">
            <div className="border-border bg-hero/50 rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Event Details
                </p>
                <p className="text-text/60 text-xs">
                    Provide information about your event. Include a clear title
                    and description to attract attendees.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* event title */}
                <Field
                    label="Event Name"
                    error={errors.title}
                    className="min-w-0 md:col-span-2"
                >
                    <Input
                        value={formState.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        error={errors.title !== undefined}
                        placeholder="Hackathon 2024"
                    />
                </Field>

                {/* location of the event */}
                <Field label="Location" error={errors.location} className="md:col-span-2">
                    <LocationSelector
                        value={formState.location}
                        onChange={(value) => updateField("location", value)}
                        error={errors.location !== undefined}
                        placeholder="Search for a location..."
                    />
                </Field>

                {/* capacity */}
                <Field label="Max Attendees (optional)" className="min-w-0">
                    <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formState.capacity || ""}
                        onChange={(e) => {
                            const value = e.target.value
                            if (value === "") return updateField("capacity", 0)
                            const num = Number(value.replace(/\D/g, ""))
                            if (!Number.isNaN(num)) updateField("capacity", num)
                        }}
                        placeholder="50"
                    />
                </Field>

                {/* tags */}
                <Field label="Tags (comma separated)" className="min-w-0">
                    <Input
                        value={formState.tags}
                        onChange={(e) => updateField("tags", e.target.value)}
                        placeholder="networking, tech, social, etc."
                    />
                </Field>

                {/* description */}
                <Field
                    label="Event Description"
                    className="min-w-0 md:col-span-2"
                >
                    <TextArea
                        value={formState.description}
                        onChange={(e) =>
                            updateField("description", e.target.value)
                        }
                        placeholder="What's happening at this event? What should attendees expect?"
                    />
                </Field>
            </div>
        </div>
    )
}
