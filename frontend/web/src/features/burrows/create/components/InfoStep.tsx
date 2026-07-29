import Field from "@features/burrows/create/components/Field.tsx"
import { Input, TextArea } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import LocationSelector from "@features/burrows/components/LocationSelector.tsx"

/**
 * {@link InfoStep}
 */
type InfoStepCopy = {
    heading: string
    subtitle: string
    titleLabel: string
    titlePlaceholder: string
    capacityLabel: string
    capacityPlaceholder: string
    tagsPlaceholder: string
    descriptionLabel: string
    descriptionPlaceholder: string
}

const COPY: Record<"STUDY" | "EVENT", InfoStepCopy> = {
    STUDY: {
        heading: "Basic Information",
        subtitle:
            "Add details about your study session. Be specific about the topic and location to help others find you.",
        titleLabel: "Title",
        titlePlaceholder: "PHYS 1301W Final",
        capacityLabel: "Max Participants (optional)",
        capacityPlaceholder: "5",
        tagsPlaceholder: "PHYS, FINAL, etc.",
        descriptionLabel: "Description",
        descriptionPlaceholder: "What are you studying? Who are you looking for?"
    },
    EVENT: {
        heading: "Event Details",
        subtitle:
            "Provide information about your event. Include a clear title and description to attract attendees.",
        titleLabel: "Event Name",
        titlePlaceholder: "Hackathon",
        capacityLabel: "Max Attendees (optional)",
        capacityPlaceholder: "50",
        tagsPlaceholder: "networking, tech, social, etc.",
        descriptionLabel: "Event Description",
        descriptionPlaceholder:
            "What's happening at this event? What should attendees expect?"
    }
}

/**
 * Shared info step for Study and Event Burrows.
 *
 * @author AJ Kneisl
 */
export default function InfoStep({
    formState,
    updateField,
    kind
}: CreateStepProps & { kind: "STUDY" | "EVENT" }) {
    const copy = COPY[kind]

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-card-border bg-card p-4">
                <p className="mb-2 text-sm font-medium text-text">
                    {copy.heading}
                </p>

                <p className="text-xs text-text/60">{copy.subtitle}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* title */}
                <Field
                    label={copy.titleLabel}
                    className="min-w-0 md:col-span-2"
                >
                    <Input
                        value={formState.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder={copy.titlePlaceholder}
                    />
                </Field>

                {/* location */}
                <Field
                    label="Location"
                    className="md:col-span-2"
                >
                    <LocationSelector
                        value={formState.location}
                        onChange={(value) => updateField("location", value)}
                        placeholder="Search for a location..."
                    />
                </Field>

                {/* capacity */}
                <Field label={copy.capacityLabel} className="min-w-0">
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
                        placeholder={copy.capacityPlaceholder}
                    />
                </Field>

                {/* tags */}
                <Field label="Tags (comma separated)" className="min-w-0">
                    <Input
                        value={formState.tags}
                        onChange={(e) => updateField("tags", e.target.value)}
                        placeholder={copy.tagsPlaceholder}
                    />
                </Field>

                {/* description */}
                <Field
                    label={copy.descriptionLabel}
                    className="min-w-0 md:col-span-2"
                >
                    <TextArea
                        value={formState.description}
                        onChange={(e) =>
                            updateField("description", e.target.value)
                        }
                        placeholder={copy.descriptionPlaceholder}
                    />
                </Field>
            </div>
        </div>
    )
}
