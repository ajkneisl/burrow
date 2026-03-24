import { SelectInput, Toggle } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import type { BurrowVisibility } from "@features/burrows/burrows.types.tsx"
import { capitalizeFirstLetter } from "@api/util.ts"

/**
 * {@link PrivacyStep}
 */
type PrivacyStepCopy = {
    subtitle: string
    selectLabel: string
    toggleTitle: string
    toggleDescription: string
}

const COPY: Record<"STUDY" | "EVENT", PrivacyStepCopy> = {
    STUDY: {
        subtitle:
            "Control who can see and join your study session. You can change these settings later.",
        selectLabel: "Privacy",
        toggleTitle: "Require approval to join",
        toggleDescription:
            "When enabled, users must request to join and wait for approval from a host or moderator"
    },
    EVENT: {
        subtitle:
            "Control who can see and attend your event. You can change these settings later.",
        selectLabel: "Event Privacy",
        toggleTitle: "Require approval to attend",
        toggleDescription:
            "When enabled, users must request to attend and wait for approval from a host or moderator"
    }
}

/**
 * Shared privacy step for Study and Event Burrows.
 *
 * @author AJ Kneisl
 */
export default function PrivacyStep({
    formState,
    updateField,
    kind
}: CreateStepProps & { kind: "STUDY" | "EVENT" }) {
    const copy = COPY[kind]

    return (
        <div className="space-y-6">
            <div className="border-card-border bg-card rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Privacy Settings
                </p>
                <p className="text-text/60 text-xs">{copy.subtitle}</p>
            </div>

            {/* visibility */}
            <div className="min-w-0">
                <SelectInput
                    text={copy.selectLabel}
                    remark="Public: visible to everyone • Unlisted: only accessible via link • Private: invite-only"
                    items={["Public", "Unlisted", "Private"]}
                    value={capitalizeFirstLetter(
                        formState.visibility.toLowerCase()
                    )}
                    onChange={(e) =>
                        updateField(
                            "visibility",
                            e.target.value.toUpperCase() as BurrowVisibility
                        )
                    }
                />
            </div>

            {/* request to join */}
            <div className="min-w-0 border-t border-neutral-200 pt-4">
                <Toggle
                    title={copy.toggleTitle}
                    description={copy.toggleDescription}
                    checked={formState.requestToJoin}
                    onChange={(checked) =>
                        updateField("requestToJoin", checked)
                    }
                />
            </div>
        </div>
    )
}
