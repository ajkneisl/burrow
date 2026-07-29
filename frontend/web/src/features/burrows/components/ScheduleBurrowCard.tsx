import clsx from "clsx"
import { formatDateTime, humanDateLabel } from "@api/util.ts"
import { Card, Chip } from "@umnburrow/core"
import {
    BURROW_KIND_CONFIG,
    type ScheduleBurrowResponse
} from "@features/burrows/burrows.types.tsx"
import { useNavigate } from "react-router"
import { MessageSquare, Pin } from "lucide-react"

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
                <div className="flex w-full items-center justify-between gap-2">
                    <h4 className="truncate text-base font-semibold text-text">
                        {burrowResponse.burrow.title}
                    </h4>

                    {/* date of burrow */}
                    <time
                        className="shrink-0 text-sm text-text/60"
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
                            <div className="flex items-center gap-1.5 text-xs text-text/60">
                                {burrowResponse.isPinned ? (
                                    <Pin className="size-3.5 shrink-0 text-warn" />
                                ) : (
                                    <MessageSquare className="size-3.5 shrink-0" />
                                )}
                                <p className="line-clamp-1 max-w-50 truncate">
                                    {burrowResponse.latestChatMessage.message}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs text-text/40">
                                <MessageSquare className="size-3.5 shrink-0" />
                                <span>No messages yet</span>
                            </div>
                        )}

                        <div className="flex flex-row items-center justify-start gap-2">
                            {burrowResponse.burrow.kind && (
                                <Chip
                                    size="md"
                                    color={
                                        BURROW_KIND_CONFIG[
                                            burrowResponse.burrow.kind
                                        ]?.className
                                    }
                                    icon={
                                        BURROW_KIND_CONFIG[
                                            burrowResponse.burrow.kind
                                        ]?.icon
                                    }
                                >
                                    {
                                        BURROW_KIND_CONFIG[
                                            burrowResponse.burrow.kind
                                        ]?.label
                                    }
                                </Chip>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
