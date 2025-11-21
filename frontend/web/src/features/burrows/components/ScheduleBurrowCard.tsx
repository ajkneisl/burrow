import clsx from "clsx"
import {
    capitalizeFirstLetter,
    formatDateTime,
    humanDateLabel
} from "@api/util.ts"
import { Card } from "@umnburrow/core"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { useNavigate } from "react-router"

/**
 * {@see ScheduleBurrowCard}
 */
type ScheduleBurrowCardProps = {
    burrowResponse: BurrowResponse
}

/**
 * A card for a Burrow that's on your schedule.
 *
 * @param burrow The burrow to display
 *
 * @see Schedule.tsx
 * @author AJ Kneisl
 */
export default function ScheduleBurrowCard({
    burrowResponse
}: ScheduleBurrowCardProps) {
    const nav = useNavigate()

    return (
        <Card
            key={burrowResponse.burrow.id}
            className={clsx(
                "from:card bg-gradient-to-br",
                burrowResponse.burrow.kind === "PROJECT"
                    ? "to-warn/40 hover:to-warn/60"
                    : "to-success/40 hover:to-success/60"
            )}
            isHoverable={true}
            onClick={() => nav(`/burrow/${burrowResponse.burrow.id}`)}
        >
            <div className="flex flex-col gap-1">
                {/* burrow title */}
                <div className="flex items-center justify-between">
                    <h4 className="text-text truncate text-base font-semibold">
                        {burrowResponse.burrow.title}
                    </h4>

                    {burrowResponse.burrow.kind && (
                        <span className="border-card-border/15 text-text/80 ml-3 rounded-full border bg-current/20 px-2 py-0.5 text-xs">
                            {capitalizeFirstLetter(
                                burrowResponse.burrow.kind.toLowerCase()
                            )}
                        </span>
                    )}
                </div>

                {/* date of burrow */}
                <time className="text-text/80 text-sm" aria-label="Time range">
                    {burrowResponse.burrow.kind === "PROJECT"
                        ? `Due ${humanDateLabel(
                              new Date(
                                  burrowResponse.burrow.endTime
                              ).toISOString()
                          )}`
                        : formatDateTime(
                              burrowResponse.burrow.beginningTime,
                              burrowResponse.burrow.endTime
                          )}
                </time>
            </div>
        </Card>
    )
}
