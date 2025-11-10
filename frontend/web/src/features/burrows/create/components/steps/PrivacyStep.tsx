import { SelectInput, Toggle } from "@umnburrow/core"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import type { BurrowVisibility } from "@features/burrows/burrows.types.ts"

/**
 * A step in the Burrow process.
 *
 * @see BurrowModal
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
                    text="Meeting Privacy"
                    remark="Public: visible to everyone • Unlisted: only accessible via link • Private: invite-only"
                    items={["PUBLIC", "UNLISTED", "PRIVATE"]}
                    value={formState.visibility}
                    onChange={(e) =>
                        updateField(
                            "visibility",
                            e.target.value as BurrowVisibility
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
                    onChange={() =>
                        updateField("requestToJoin", !formState.requestToJoin)
                    }
                />
            </div>
        </div>
    )
}
