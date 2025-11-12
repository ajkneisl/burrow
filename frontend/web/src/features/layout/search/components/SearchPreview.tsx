import type { Burrow } from "@features/burrows/burrows.types.ts"
import { useNavigate } from "react-router"
import { formatDateTime } from "@api/util.ts"
import clsx from "clsx"
import { Badge } from "@umnburrow/core"

/**
 * {@link SearchPreview}
 */
type PreviewProps = {
    meeting: Burrow
    onClick: () => void
}

/**
 * A preview of a search entry.
 *
 * @param meeting The meeting to preview.
 * @param onClick When the meeting is clicked (close search thing)
 * @constructor
 */
export default function SearchPreview({ meeting, onClick }: PreviewProps) {
    const nav = useNavigate()

    return (
        <button
            type="button"
            onClick={() => {
                nav(`/meeting/${meeting.id}`)
                onClick()
            }}
            className={clsx(
                "flex flex-row justify-between items-center w-full text-left px-3 py-2",
                "text-text bg-hero/20 hover:bg-hero/40 transition-all cursor-pointer"
            )}
        >
            <div className="flex flex-col">
                <div className="text-sm font-medium text-text">
                    {meeting.title}
                </div>

                <div className="flex flex-row flex-wrap gap-2 mt-2">
                    {meeting.tags.map((tag: string) => (
                        <Badge size="medium" key={tag}>{tag}</Badge>
                    ))}
                </div>
            </div>

            <div>
                <div className=" text-xs flex items-center gap-1 text-text/80">
                    {/* location pin icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path d="M12 2.25c-3.728 0-6.75 2.99-6.75 6.68 0 4.989 6.053 11.744 6.311 12.03a.75.75 0 0 0 1.078 0c.258-.286 6.311-7.041 6.311-12.03 0-3.69-3.022-6.68-6.95-6.68Zm0 9.18a2.5 2.5 0 1 1 0-5.001 2.5 2.5 0 0 1 0 5z" />
                    </svg>
                    <p className="truncate">
                        {meeting.location
                            ?.split(" ")[0]
                            ?.charAt(0)
                            .toUpperCase() +
                            meeting.location
                                ?.split(" ")[0]
                                ?.slice(1)
                                .toLowerCase()}
                    </p>
                </div>

                <time
                    className="text-xs text-text/60"
                    aria-label="Time Occurring"
                >
                    {formatDateTime(meeting.beginningTime, meeting.endTime)}
                </time>
            </div>
        </button>
    )
}
