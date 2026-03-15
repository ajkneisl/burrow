import clsx from "clsx"
import { formatDateTime, humanDateLabel } from "@api/util.ts"
import { Card, Chip } from "@umnburrow/core"
import {
    BURROW_KIND_CONFIG,
    type BurrowKind,
    type ScheduleBurrowResponse
} from "@features/burrows/burrows.types.tsx"
import { useNavigate } from "react-router"
import { MessageSquare, Pin } from "lucide-react"

/**
 * Get the border color based on the kind of Burrow.
 *
 * @param kind The kind of Burrow
 */
function getBurrowColor(kind: BurrowKind) {
    switch (kind) {
        case "EVENT":
            return "border-r-4 border-secondary border-0"
        case "PROJECT":
            return "border-r-4 border-error border-0"
        case "STUDY":
            return "border-r-4 border-success border-0"
        case "CLUB":
            return "border-r-4 border-info border-0"
    }
}

/**
 * {@see ScheduleBurrowCard}
 */
type ScheduleBurrowCardProps = {
    burrowResponse: ScheduleBurrowResponse
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
                getBurrowColor(burrowResponse.burrow.kind)
            )}
            isHoverable={true}
            onClick={() => nav(`/burrow/${burrowResponse.burrow.id}`)}
        >
            <div
                className={clsx(
                    "flex gap-1",
                    burrowResponse.burrow.kind === "PROJECT"
                        ? "flex-row items-start justify-between"
                        : "flex-col"
                )}
            >
                {/* burrow title */}
                <div className="flex w-full items-center justify-between ">
                    <h4 className="text-text max-w-1/2 truncate text-base font-semibold">
                        {burrowResponse.burrow.title}
                    </h4>

                    {/* date of burrow */}
                    <time
                        className="text-text/80 text-sm"
                        aria-label="Time range"
                    >
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

                {burrowResponse.burrow.kind !== "PROJECT" && (
                    <div className="flex flex-row items-center justify-between">
                        {/* chat preview */}
                        {burrowResponse.latestChatMessage ? (
                            <div className="text-text/60 flex items-center gap-1.5 text-xs">
                                {burrowResponse.isPinned ? (
                                    <Pin className="text-warn h-3.5 w-3.5 shrink-0" />
                                ) : (
                                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                )}
                                <p className="line-clamp-1 max-w-[200px] truncate">
                                    {burrowResponse.latestChatMessage.message}
                                </p>
                            </div>
                        ) : (
                            <div className="text-text/40 flex items-center gap-1.5 text-xs italic">
                                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                <span>No messages yet</span>
                            </div>
                        )}

                        <div className="flex flex-row items-center justify-start gap-2">
                            {burrowResponse.burrow.kind && (
                                <Chip
                                    size="md"
                                    color={BURROW_KIND_CONFIG[burrowResponse.burrow.kind]?.className}
                                    icon={BURROW_KIND_CONFIG[burrowResponse.burrow.kind]?.icon}
                                >
                                    {BURROW_KIND_CONFIG[burrowResponse.burrow.kind]?.label}
                                </Chip>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
