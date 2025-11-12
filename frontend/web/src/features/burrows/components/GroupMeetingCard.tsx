import { useNavigate } from "react-router"
import type { BurrowResponse } from "@features/burrows/burrows.types.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import { formatDateTime } from "@api/util.ts"
import { Badge, Card } from "@umnburrow/core"
import clsx from "clsx"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useMemo } from "react"
import MeetingCapacityBadges from "@features/burrows/components/MeetingCapacityBadges.tsx"

/**
 * {@see GroupMeetingCard}
 */
type GroupMeetingCardProps = {
    meetingResponse: BurrowResponse
    details?: boolean
}

/**
 * A group card, both study and club meetings.
 *
 * @param meetingResponse The meeting details.
 * @param details If extra details should be shown.
 */
export function GroupMeetingCard({
    meetingResponse,
    details
}: GroupMeetingCardProps) {
    const nav = useNavigate()

    const user = useUser()
    const { burrow } = meetingResponse

    const isPast = burrow.endTime < Date.now()

    const isOwner = useMemo(
        () => user !== null && burrow.ownerID === user.id,
        [burrow.ownerID, user]
    )

    const isJoined = useMemo(
        () => meetingResponse?.membership?.status === "JOINED",
        [meetingResponse?.membership?.status]
    )

    const tags: Record<string, boolean> = useMemo(() => {
        const highlightedSet = new Set(meetingResponse.highlightedTags)
        const tags: Record<string, boolean> = {}

        // Add highlighted tags first
        meetingResponse.burrow.tags.forEach((tag, index) => {
            if (highlightedSet.has(index)) {
                tags[tag] = true
            }
        })

        // Then add non-highlighted tags
        meetingResponse.burrow.tags.forEach((tag, index) => {
            if (!highlightedSet.has(index)) {
                tags[tag] = false
            }
        })

        return tags
    }, [meetingResponse.highlightedTags, meetingResponse.burrow.tags])

    // navigate to the club page :)
    const onClick = () => {
        nav(`/meeting/${burrow.id}`)
    }

    return (
        <Card onClick={onClick} isHoverable={true} className="w-full">
            <div className="flex flex-col gap-4">
                <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="text-text/70 flex flex-col items-start justify-between gap-2 text-sm">
                        {/* title, description and timing */}
                        <div className="flex w-full flex-col ">
                            {/* title */}
                            <div className="flex w-full items-center justify-between gap-3">
                                <h3
                                    className={clsx(
                                        "text-md text-text truncate font-semibold tracking-tight",
                                        !details && "max-w-[16ch]"
                                    )}
                                >
                                    {burrow.title}
                                </h3>
                            </div>

                            {/* timing */}
                            <div className="flex flex-row gap-2">
                                <time
                                    className="text-text/80 inline-flex items-center gap-1 rounded-full text-xs font-medium"
                                    aria-label="Time Occurring"
                                >
                                    {formatDateTime(
                                        burrow.beginningTime,
                                        burrow.endTime
                                    )}
                                </time>
                            </div>

                            {/* description */}
                            {details && (
                                <p className="text-text/70 mt-2 max-w-prose text-sm text-clip">
                                    {burrow.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {/* if it's in the past */}
                        {isPast && details && (
                            <span
                                className="text-error ring-error/30 bg-error/10 inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 ring-inset"
                                title="This meeting is archived"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V8.25a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 8.25v10.5M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M3 18.75V8.25M21 18.75V8.25M8.25 12h7.5"
                                    />
                                </svg>
                                <span className="text-xs font-medium">
                                    Past Meeting
                                </span>
                            </span>
                        )}

                        {/* is joined */}
                        {isJoined && details && (
                            <span
                                className="bg-success/10 text-success ring-success/30 inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset"
                                title="You're a member"
                            >
                                <span className="sr-only">Joined</span>

                                {/* a checkmark */}
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

                        {/* is the owner */}
                        {isOwner && details && (
                            <span
                                className="bg-warn/10 text-warn ring-warn/30 inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset"
                                title="You are the host"
                            >
                                <span className="sr-only">Host</span>

                                {/* a star */}
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

                        {/* is bookmarked :o */}
                        {meetingResponse.bookmarked && (
                            <span
                                className="bg-secondary/10 text-secondary ring-secondary/30 inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset"
                                title="Bookmarked"
                            >
                                <span className="sr-only">Bookmarked</span>

                                {/* a bookmark */}
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

                        {/* the profile picture */}
                        <div className="flex-shrink-0 self-start">
                            <ProfilePicture
                                name={
                                    meetingResponse.burrowAuthorProfile
                                        ?.name ?? ""
                                }
                                userID={
                                    meetingResponse.burrowAuthorProfile
                                        ?.userID ?? ""
                                }
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* extra details depending on choice */}
                {!details ? (
                    <div className="flex flex-row items-center justify-between">
                        <div className="flex flex-row flex-wrap gap-1.5 pt-1">
                            {Object.keys(tags)
                                .slice(0, 2)
                                .map((tag: string) => (
                                    <Badge size="medium" highlighted={tags[tag]} key={tag}>
                                        {tag}
                                    </Badge>
                                ))}
                        </div>

                        {isJoined && (
                            <p className="text-text/40 inline-flex gap-2 text-xs">
                                Joined{" "}
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
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-row justify-between gap-3 sm:items-center">
                        {/* tags */}
                        <div className="flex flex-row flex-wrap gap-1.5 pt-1">
                            {burrow.tags.map((tag: string) => (
                                <Badge key={tag}>{tag}</Badge>
                            ))}
                        </div>

                        {/* location / counts */}
                        <div className="flex items-center gap-3 text-sm">
                            <div className="bg-hero text-text/80 ring-primary/15 hidden items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset sm:flex">
                                {/* location pin icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="text-text/60 h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                    focusable="false"
                                >
                                    <path d="M12 2.25c-3.728 0-6.75 2.99-6.75 6.68 0 4.989 6.053 11.744 6.311 12.03a.75.75 0 0 0 1.078 0c.258-.286 6.311-7.041 6.311-12.03 0-3.69-3.022-6.68-6.95-6.68Zm0 9.18a2.5 2.5 0 1 1 0-5.001 2.5 2.5 0 0 1 0 5z" />
                                </svg>

                                {/* location pin */}
                                <p className="truncate">
                                    {burrow.location
                                        ?.split(" ")[0]
                                        ?.charAt(0)
                                        .toUpperCase() +
                                        burrow.location
                                            ?.split(" ")[0]
                                            ?.slice(1)
                                            .toLowerCase()}
                                </p>
                            </div>

                            {/* capacity */}
                            <MeetingCapacityBadges meeting={burrow} />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
