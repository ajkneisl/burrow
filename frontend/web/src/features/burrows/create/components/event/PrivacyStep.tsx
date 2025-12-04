import { SelectInput, Toggle } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import type { BurrowVisibility } from "@features/burrows/burrows.types.tsx"
import { capitalizeFirstLetter } from "@api/util.ts"

/**
 * Privacy step for creating an event.
 *
 * @see CreateEventBurrowModal
 *
 * @author AJ Kneisl
 */
export default function PrivacyStep({
    formState,
    updateField
}: CreateStepProps) {
    return (
        <div className="space-y-6">
            <div className="border-border bg-hero/50 rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Privacy Settings
                </p>
                <p className="text-text/60 text-xs">
                    Control who can see and attend your event. You can change
                    these settings later.
                </p>
            </div>

            {/* visibility */}
            <div className="min-w-0">
                <SelectInput
                    text="Event Privacy"
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
                    title="Require approval to attend"
                    description="When enabled, users must request to attend and wait for approval from a host or moderator"
                    checked={formState.requestToJoin}
                    onChange={(checked) =>
                        updateField("requestToJoin", checked)
                    }
                />
            </div>
        </div>
    )
}
