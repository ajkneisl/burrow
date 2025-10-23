import { useNavigate } from "react-router"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import MeetingCapacityBadges from "@features/groups/components/MeetingCapacityBadges.tsx"
import { formatDateTime } from "@api/util.ts"
import { Badge, Card } from "@umnburrow/core"

/**
 * A group card, both study and club meetings.
 *
 * @param meetingResponse The meeting details.
 * @constructor
 */
export function GroupMeetingCard(meetingResponse: GroupMeetingResponse) {
    const nav = useNavigate()

    const user = useUser()
    const { meeting } = meetingResponse
    const isPast = meeting.endTime < Date.now()

    // navigate to the club page :)
    const onClick = () => {
        nav(`/meeting/${meeting.id}`)
    }

    return (
        <Card onClick={onClick} isHoverable={true} className="w-full">
            <div className="flex flex-col gap-4">
                <div className="min-w-0 flex items-start justify-between gap-4">
                    <div className="flex flex-col items-start justify-between gap-2 text-sm text-text/70">
                        {/* title, description and timing */}
                        <div className="flex flex-col">
                            {/* title */}
                            <h3 className="truncate text-lg font-semibold tracking-tight text-text">
                                {meeting.title}
                            </h3>

                            {/* timing */}
                            <div className="flex flex-row gap-2">
                                <time
                                    className="inline-flex items-center gap-1 rounded-full text-sm font-medium text-text/80"
                                    aria-label="Time Occurring"
                                >
                                    {formatDateTime(
                                        meeting.beginningTime,
                                        meeting.endTime
                                    )}
                                </time>
                            </div>

                            {/* description */}
                            <p className="mt-2 max-w-prose text-clip text-sm text-text/70">
                                {meeting.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-start gap-2">
                        {isPast && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-text/70 ring-1 ring-inset ring-text/20"
                                title="This meeting has ended"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M12 1.75a10.25 10.25 0 1 0 10.25 10.25A10.262 10.262 0 0 0 12 1.75Zm.75 5.5h-1.5v5.25l4.5 2.625.75-1.29-3.75-2.185Z" />
                                </svg>
                                <span className="text-xs font-medium">
                                    Past Meeting
                                </span>
                            </span>
                        )}
                        {meetingResponse?.membership?.status === "JOINED" && (
                            <span
                                className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-success ring-1 ring-inset ring-success/30"
                                title="You're a member"
                            >
                                <span className="sr-only">Joined</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    width="18"
                                    height="18"
                                    fill="currentColor"
                                >
                                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                                </svg>
                            </span>
                        )}

                        {user !== null && meeting.owner === user.id && (
                            <span
                                className="inline-flex items-center rounded-full bg-warn/10 px-2.5 py-1 text-warn ring-1 ring-inset ring-warn/30"
                                title="You are the host"
                            >
                                <span className="sr-only">Host</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 1.402 8.178L12 18.896l-7.336 3.854 1.402-8.178L.132 9.21l8.2-1.192L12 .587z" />
                                </svg>
                            </span>
                        )}

                        {meetingResponse.bookmarked && (
                            <span
                                className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-1 text-secondary ring-1 ring-inset ring-secondary/30"
                                title="Bookmarked"
                            >
                                <span className="sr-only">Bookmarked</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M6.32 2.75A2.25 2.25 0 0 0 4.25 5v16a.75.75 0 0 0 1.2.6l6.33-4.75 6.33 4.75a.75.75 0 0 0 1.2-.6V5A2.25 2.25 0 0 0 17.68 2.75H6.32z" />
                                </svg>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-row justify-between gap-3 sm:items-center">
                    {/* tags */}
                    <div className="flex flex-row flex-wrap gap-1.5 pt-1">
                        {meeting.tags.map((tag: string) => (
                            <Badge key={tag}>{tag}</Badge>
                        ))}
                    </div>

                    {/* person counts */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 rounded-full bg-hero px-3 py-1 text-sm font-medium text-text/80 ring-1 ring-inset ring-primary/15">
                            {/* location pin icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4 shrink-0 text-text/60"
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

                        <MeetingCapacityBadges meeting={meeting} />
                    </div>
                </div>
            </div>
        </Card>
    )
}
