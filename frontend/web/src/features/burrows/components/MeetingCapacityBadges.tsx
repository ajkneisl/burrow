import type { Burrow } from "@features/burrows/burrows.types.ts"
import { useMemo } from "react"
import clsx from "clsx"

/**
 * {@see GroupMeetingBadges}
 */
type MeetingCapacityProps = {
    meeting: Burrow
}

/**
 * The badges on a meeting, conveying the capacity and waitlist.
 * @constructor
 */
export default function MeetingCapacityBadges({
    meeting
}: MeetingCapacityProps) {
    const hasLimit = meeting.capacity > 0
    const joined = meeting.joined ?? 0
    const capacity = meeting.capacity ?? 0

    const capacityLabel = hasLimit ? `${joined}/${capacity}` : "No limit"
    const fillPct =
        hasLimit && capacity > 0 ? Math.min(joined / capacity, 1) * 100 : 0

    const [capClasses, capFill] = useMemo(() => {
        if (!hasLimit) {
            return ["border-info bg-info/10 text-info", "bg-info/20"]
        } else if (joined >= capacity) {
            return ["border-error bg-error/10 text-error", "bg-error/20"]
        } else if (joined / capacity >= 0.8) {
            return ["border-warn bg-warn/10 text-warn", "bg-warn/20"]
        } else {
            return [
                "border-success bg-success/10 text-success",
                "bg-success/20"
            ]
        }
    }, [hasLimit, joined, capacity])

    if (joined === -1)
        return <></>

    return (
        <>
            <span
                className={clsx(
                    `relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-xs font-medium shadow-sm`,
                    capClasses
                )}
                aria-label="Capacity"
            >
                {/* fill bar */}
                {hasLimit && (
                    <span
                        className={`absolute top-0 left-0 h-full ${capFill}`}
                        style={{ width: `${fillPct}%` }}
                        aria-hidden
                    />
                )}

                {/* icon + label (kept above fill) */}
                <span className="relative z-10 flex items-center gap-1.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden
                    >
                        <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path
                            fillRule="evenodd"
                            d="M.458 16.042A8 8 0 0 1 10 12a8 8 0 0 1 9.542 4.042.75.75 0 0 1-.676 1.108H1.134a.75.75 0 0 1-.676-1.108Z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {capacityLabel}
                </span>
            </span>

            {/* waitlist */}
            {meeting.waiting > 0 && (
                <span className="border-warn bg-warn/10 text-warn inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden
                    >
                        <path d="M7.5 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm9 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2 20c0-2.5 2-4.5 4.5-4.5h3c2.5 0 4.5 2 4.5 4.5v1H2v-1Zm12.5 0c0-2.5 2-4.5 4.5-4.5h3c2.5 0 4.5 2 4.5 4.5v1h-12v-1Z" />
                    </svg>
                    {meeting.waiting}
                </span>
            )}
        </>
    )
}
