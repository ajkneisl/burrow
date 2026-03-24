import Field from "@features/burrows/create/components/Field.tsx"
import { Input, TextArea } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"

/**
 * Info step for creating a project.
 *
 * @see CreateProjectBurrowModal
 */
export default function InfoStep({
    formState,
    updateField
}: CreateStepProps) {
    return (
        <div className="space-y-6">
            {/* project name */}
            <Field
                label="Project Name"
                className="min-w-0"
            >
                <Input
                    value={formState.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Final Research Paper"
                />
            </Field>

            {/* class (optional) */}
            <Field label="Class (optional)" className="min-w-0">
                <Input
                    value={formState.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="CSCI 4041"
                />
            </Field>

            {/* objective */}
            <Field
                label="Project Objective"
                className="min-w-0"
            >
                <TextArea
                    value={formState.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="What is the goal of this project? What needs to be accomplished?"
                />
            </Field>
        </div>
    )
}
