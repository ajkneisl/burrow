import Field from "@features/burrows/create/components/Field.tsx"
import { Input, TextArea } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"

/**
 * A step in the Burrow process.
 *
 * @see BurrowModal
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
                    Basic Information
                </p>
                <p className="text-text/60 text-xs">
                    Add details about your study session. Be specific about the
                    topic and location to help others find you.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* title of the session */}
                <Field label="Title" error={errors.title} className="min-w-0">
                <Input
                    value={formState.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    error={errors.title !== undefined}
                    placeholder="PHYS 1301W Final"
                />
            </Field>

            {/* location of the session */}
            <Field label="Location" error={errors.location}>
                <Input
                    value={formState.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    error={errors.location !== undefined}
                    placeholder="Hall & Room"
                />
            </Field>

            {/* capacity */}
            <Field label="Max Participants (optional)">
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
                    placeholder="5"
                />
            </Field>

            {/* tags*/}
            <Field label="Tags (comma separated)" className="min-w-0">
                <Input
                    value={formState.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                    placeholder="PHYS, FINAL, etc."
                />
            </Field>

                {/* description */}
                <Field label="Description" className="min-w-0 md:col-span-2">
                    <TextArea
                        value={formState.description}
                        onChange={(e) =>
                            updateField("description", e.target.value)
                        }
                        placeholder="What're you studying? Who are you looking for?"
                    />
                </Field>
            </div>
        </div>
    )
}
