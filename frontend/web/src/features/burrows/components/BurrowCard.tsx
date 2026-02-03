import { useNavigate } from "react-router"
import {
    BURROW_KIND_CONFIG,
    type BurrowResponse
} from "@features/burrows/burrows.types.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import { formatDateTime } from "@api/util.ts"
import { Badge, Card } from "@umnburrow/core"
import clsx from "clsx"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useMemo } from "react"
import BurrowCapacity from "@features/burrows/components/BurrowCapacity.tsx"
import {
    Calendar,
    Check,
    Star,
    Bookmark,
    MapPin,
    GraduationCap
} from "lucide-react"

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

    const tags: Record<string, boolean> = useMemo(() => {
        const highlightedSet = new Set(meetingResponse.highlightedTags)
        const tags: Record<string, boolean> = {}

        meetingResponse.burrow.tags.forEach((tag, index) => {
            tags[tag] = highlightedSet.has(index)
        })

        return tags
    }, [meetingResponse.highlightedTags, meetingResponse.burrow.tags])

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
                                        "text-md text-text truncate font-semibold tracking-tight",
                                        !details && "max-w-[16ch]"
                                    )}
                                >
                                    {burrow.title}
                                </h3>
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

                        {/* is joined */}
                        {isJoined && !isOwner && details && (
                            <span
                                className="bg-success/10 text-success ring-success/30 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset"
                                title="You're a member"
                            >
                                <Check className="h-4 w-4" />
                                Joined
                            </span>
                        )}

                        {/* is the owner */}
                        {isOwner && details && (
                            <span
                                className="bg-warn/10 text-warn ring-warn/30 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset"
                                title="You are the host"
                            >
                                <Star className="h-4 w-4" />
                                Host
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
                            <ProfilePicture
                                name={
                                    meetingResponse.burrowAuthorProfile?.name ??
                                    ""
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
                        <div className="flex flex-row flex-wrap items-center gap-1.5 pt-1">
                            {/* burrow type */}
                            <span
                                className={clsx(
                                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    BURROW_KIND_CONFIG[burrow.kind]?.className,
                                    "bg-current/10"
                                )}
                            >
                                {BURROW_KIND_CONFIG[burrow.kind]?.icon}
                                {BURROW_KIND_CONFIG[burrow.kind]?.label}
                            </span>

                            {/* TA badge */}
                            {meetingResponse.hostedByTa && (
                                <span className="bg-info/10 text-info inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                                    <GraduationCap className="h-3 w-3" />
                                    TA
                                </span>
                            )}

                            {Object.keys(tags)
                                .slice(0, 2)
                                .map((tag: string) => (
                                    <Badge
                                        size="medium"
                                        highlighted={tags[tag]}
                                        key={tag}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                        </div>

                        {isJoined && (
                            <p className="text-text/40 inline-flex gap-2 text-xs">
                                Joined <Check width="18" height="18" />
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-row justify-between gap-3 sm:items-center">
                        {/* tags */}
                        <div className="flex flex-row flex-wrap items-center gap-1.5 pt-1">
                            {/* burrow type */}
                            <span
                                className={clsx(
                                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    BURROW_KIND_CONFIG[burrow.kind]?.className,
                                    "bg-current/10"
                                )}
                            >
                                {BURROW_KIND_CONFIG[burrow.kind]?.icon}
                                {BURROW_KIND_CONFIG[burrow.kind]?.label}
                            </span>

                            {/* TA badge */}
                            {meetingResponse.hostedByTa && (
                                <span className="bg-info/10 text-info inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                                    <GraduationCap className="h-3 w-3" />
                                    TA
                                </span>
                            )}

                            {burrow.tags.map((tag: string) => (
                                <Badge key={tag}>{tag}</Badge>
                            ))}
                        </div>

                        {/* location / counts */}
                        <div className="flex items-center gap-3 text-sm">
                            {burrow.location.trim() !== "" && (
                                <div className="bg-hero text-text/80 ring-primary/15 hidden items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset sm:flex">
                                    {/* location pin icon */}
                                    <MapPin className="text-text/60 h-4 w-4 shrink-0" />

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
                            )}

                            {/* action badge */}
                            {actionBadge}

                            {/* capacity */}
                            <BurrowCapacity burrow={burrow} />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
