import { useNavigate } from "react-router"
import {
    BURROW_KIND_CONFIG,
    type BurrowResponse,
    getReoccurringText,
    NOT_REOCCURRING
} from "@features/burrows/burrows.types.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import { formatDateTime } from "@api/util.ts"
import { Card, Chip, Hover } from "@umnburrow/core"
import clsx from "clsx"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"
import BurrowCapacity from "@features/burrows/components/BurrowCapacity.tsx"
import { Calendar, Bookmark, MapPin, GraduationCap } from "lucide-react"

/**
 * {@see GroupMeetingCard}
 */
type GroupMeetingCardProps = {
    meetingResponse: BurrowResponse
    details?: boolean
    actionBadge?: React.ReactNode
}

/**
 * A group card, both study and club meetings.
 *
 * @param meetingResponse The meeting details.
 * @param details If extra details should be shown.
 * @param actionBadge Optional action badge to display next to location.
 *
 * @author AJ Kneisl
 */
export function BurrowCard({
    meetingResponse,
    details,
    actionBadge
}: GroupMeetingCardProps) {
    const nav = useNavigate()

    const user = useUser()
    const { burrow } = meetingResponse

    const isPast = burrow.endTime < Date.now()
    const isOwner = user !== null && burrow.ownerID === user.id
    const isJoined = meetingResponse?.membership?.status === "JOINED"

    // navigate to the burrow page :)
    const onClick = () => {
        nav(`/burrow/${burrow.id}`)
    }

    return (
        <Card onClick={onClick} isHoverable={true} className="group w-full">
            <div className="flex flex-col gap-4">
                <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="text-text/70 flex flex-col items-start justify-between gap-2 text-sm">
                        {/* title, description and timing */}
                        <div className="flex w-full flex-col ">
                            {/* title */}
                            <div className="flex w-full items-center gap-2">
                                <h3
                                    className={clsx(
                                        "text-md text-text truncate items-center flex font-semibold tracking-tight",
                                        !details && "max-w-[16ch]"
                                    )}
                                >
                                    {burrow.title}

                                    {/* TA badge */}
                                    {meetingResponse.hostedByTa && (
                                        <div className="text-info mx-1">
                                            <Hover content="This Burrow is hosted by a TA">
                                                <GraduationCap className="h-3.5 w-3.5" />
                                            </Hover>
                                        </div>
                                    )}
                                </h3>

                                {isJoined && !isOwner && (
                                    <p className="text-text/40 inline-flex items-center text-xs">
                                        Joined
                                    </p>
                                )}

                                {isOwner && (
                                    <p className="text-text/40 inline-flex items-center text-xs">
                                        Hosting
                                    </p>
                                )}
                            </div>

                            {/* timing */}
                            <div className="flex flex-row items-center gap-2">
                                <time
                                    className="text-text/80 inline-flex items-center gap-1 rounded-full text-xs font-medium"
                                    aria-label="Time Occurring"
                                >
                                    {formatDateTime(
                                        burrow.beginningTime,
                                        burrow.endTime
                                    )}

                                    {burrow.reoccurring !== NOT_REOCCURRING &&
                                        ` ${getReoccurringText(burrow.reoccurring, true)}`}
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
                                <Calendar width="18" height="18" />
                                <span className="text-xs font-medium">
                                    Past Meeting
                                </span>
                            </span>
                        )}

                        {/* is bookmarked :o */}
                        {meetingResponse.bookmarked && (
                            <span
                                className="bg-info/10 text-info ring-info/30 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset"
                                title="Bookmarked"
                            >
                                <Bookmark className="h-4 w-4" />
                                {details && "Bookmarked"}
                            </span>
                        )}

                        {/* the profile picture */}
                        <div className="flex-shrink-0 self-start">
                            {burrow.clubID &&
                            meetingResponse.clubDisplayName ? (
                                <ClubProfilePicture
                                    clubID={burrow.clubID}
                                    displayName={
                                        meetingResponse.clubDisplayName
                                    }
                                    clubName={meetingResponse.clubName ?? ""}
                                    size="sm"
                                />
                            ) : (
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
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center justify-between">
                    {/* tags*/}
                    <div className="flex flex-row items-center gap-1 pt-1">
                        {details &&
                            burrow.tags.map((tag: string) => (
                                <Chip size="md" key={tag}>
                                    {tag}
                                </Chip>
                            ))}
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-1.5 pt-1">
                        {details && burrow.location.trim() !== "" && (
                            <Chip size="md" color="secondary" icon={MapPin}>
                                {burrow.location.includes(",")
                                    ? burrow.location.split(",")[0]
                                    : burrow.location.substring(0, 16)}
                            </Chip>
                        )}

                        {/* action badge */}
                        {details && actionBadge}

                        {/* capacity */}
                        {burrow.capacity > 0 && (
                            <BurrowCapacity burrow={burrow} />
                        )}

                        {/* burrow type */}
                        <Chip
                            size="md"
                            color={BURROW_KIND_CONFIG[burrow.kind]?.className}
                            icon={BURROW_KIND_CONFIG[burrow.kind]?.icon}
                        >
                            {BURROW_KIND_CONFIG[burrow.kind]?.label}
                        </Chip>
                    </div>
                </div>
            </div>
        </Card>
    )
}
