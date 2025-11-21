import { SelectInput, Toggle } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import type { BurrowVisibility } from "@features/burrows/burrows.types.ts"
import { capitalizeFirstLetter } from "@api/util.ts"

/**
 * A step in the Burrow process.
 *
 * @see BurrowModal
 *
 * @author AJ Kneisl
 */
export default function PrivacyStep({
    formState,
    updateField
}: CreateStepProps) {
    return (
        <div className="space-y-6">
            {/* visibility */}
            <div className="min-w-0">
                <SelectInput
                    text="Privacy"
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
                    title="Require approval to join"
                    description="When enabled, users must request to join and wait for approval from a host or moderator"
                    checked={formState.requestToJoin}
                    onChange={(checked) =>
                        updateField("requestToJoin", checked)
                    }
                />
            </div>
        </div>
    )
}
