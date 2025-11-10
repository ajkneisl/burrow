import { Link, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import useUser from "@features/auth/hooks/useUser.ts"
import { useMemo } from "react"
import { getMeeting } from "@features/burrows/burrows.api.ts"
import MeetingLocation from "@features/burrows/components/MeetingLocation.tsx"
import DeleteMeeting from "@features/burrows/components/DeleteMeeting.tsx"
import { formatDateTime } from "@api/util.ts"
import JoinMeeting from "@features/burrows/components/JoinMeeting.tsx"
import MeetingCapacityBadges from "@features/burrows/components/MeetingCapacityBadges.tsx"
import EditMeeting from "@features/burrows/components/EditMeeting.tsx"
import ChatBox from "@features/chat/components/ChatBox.tsx"
import ViewAttendees from "@features/burrows/components/attendees/ViewAttendees.tsx"
import Pomodoro from "@features/sync/components/Pomodoro.tsx"
import useSync from "@features/sync/hooks/useSync.tsx"
import { BurrowFeatures } from "@features/sync/components/BurrowFeatures.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { blockStatus } from "@features/sync/sync.atom.ts"
import { Badge, Card, Hover } from "@umnburrow/core"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import BurrowJoinRequests from "@features/burrows/invites/components/BurrowJoinRequests.tsx"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import BurrowInvites from "@features/burrows/invites/components/BurrowInvites.tsx"
import ShareMeeting from "@features/burrows/components/ShareMeeting.tsx"
import BookmarkMeeting from "@features/burrows/components/BookmarkMeeting.tsx"

/**
 * View an individual meeting.
 * @constructor
 */
export default function Meeting() {
    const { id } = useParams<{ id: string }>()

    const auth = useToken()
    const user = useUser()

    const [blocks] = useAtom(blockStatus)

    const { data, isLoading, error } = useQuery({
        queryKey: [`meeting`, id],
        enabled: id !== null,
        queryFn: async () => await getMeeting(id!)
    })

    useSync(data)

    // if the user is the owner
    const isOwner = useMemo(
        () => auth !== "" && user !== null && user.id === data?.burrow?.ownerID,
        [auth, data?.burrow?.ownerID, user]
    )

    const isModerator = useMemo(
        () => isOwner || data?.membership?.role === "MODERATOR",
        [isOwner, data?.membership?.role]
    )

    // if the user is in the meeting
    const inMeeting = useMemo(
        () => data?.membership?.status === "JOINED" || isOwner,
        [data?.membership?.status, isOwner]
    )

    // if the meeting is in the past
    const inPast = useMemo(
        () => (data?.burrow?.endTime ?? 0) < new Date().valueOf(),
        [data?.burrow?.endTime]
    )

    // if the user isn't logged in
    const isLoggedOut = useMemo(() => auth === null, [auth])

    // Set meta tags for this meeting
    useMetaTags({
        title: data?.burrow?.title,
        description: data?.burrow.description || undefined,
        url: `https://umn.app/${id}`,
        image: "https://umn.app/burrow.png"
    })

    if (isLoading)
        return (
            <main className="bg-card-background/70 min-h-screen animate-pulse px-4 py-8 md:px-8">
                <div className="space-y-4">
                    <div className="bg-text/10 h-10 w-2/3 rounded-lg" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="bg-text/10 h-64 rounded-2xl" />
                        <div className="bg-text/10 h-64 rounded-2xl lg:col-span-2" />
                    </div>
                </div>
            </main>
        )

    if (error || !data || !id)
        return (
            <main className="bg-background text-text min-h-screen px-4 py-8 md:px-8">
                <div
                    role="alert"
                    className="border-error/30 bg-error/10 text-error rounded-md border p-4 text-sm"
                >
                    Error loading meeting.
                </div>
            </main>
        )

    const { burrow, burrowAuthor } = data

    const tags = Array.from(burrow.tags ?? [])

    return (
        <main className="min-h-screen">
            {/* memo to join burrow */}
            {isLoggedOut && (
                <div className="text-text bg-primary mt-4 w-full rounded-2xl px-4 py-3 text-center shadow-md">
                    <p className="text-sm font-medium sm:text-base">
                        Interested in this Burrow?
                        <br />
                        <Link
                            to="/welcome"
                            className="hover:text-text/40 mt-4 font-semibold underline underline-offset-4 transition-colors"
                        >
                            Join Burrow Today
                        </Link>
                    </p>
                </div>
            )}

            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* header */}
                        <Card className="relative order-first col-span-1 p-6 lg:col-span-3">
                            <div className="flex flex-col gap-4">
                                <div className="min-w-0">
                                    {/* archive notice*/}
                                    {inPast && (
                                        <Hover
                                            content={
                                                "You may not edit or interact with this meeting."
                                            }
                                        >
                                            <div className="bg-text/10 text-text/80 mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1 text-sm font-medium">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="h-4 w-4"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V8.25a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 8.25v10.5M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M3 18.75V8.25M21 18.75V8.25M8.25 12h7.5"
                                                    />
                                                </svg>
                                                <span>
                                                    This meeting is archived
                                                </span>
                                            </div>
                                        </Hover>
                                    )}

                                    {/* title */}
                                    <h1 className="text-text mt-3 truncate text-xl font-bold tracking-tight md:text-3xl">
                                        {burrow.title}
                                    </h1>

                                    <div className="my-1 flex flex-col-reverse items-center gap-2 text-sm md:flex-row">
                                        {/* host / author */}
                                        <div className="flex flex-row items-center gap-2">
                                            <ProfilePicture
                                                name={
                                                    data.burrowAuthorProfile
                                                        ?.name ||
                                                    burrowAuthor ||
                                                    "Unknown"
                                                }
                                                userID={burrow.ownerID}
                                                size={"sm"}
                                            />
                                            <p className="text-text/60 text-sm">
                                                Hosted by{" "}
                                                <span className="text-text/80 font-medium">
                                                    {data.burrowAuthorProfile
                                                        ?.name || burrowAuthor}
                                                </span>
                                            </p>
                                        </div>

                                        <span className="text-text/50 hidden md:block">
                                            —
                                        </span>

                                        {/* date */}
                                        <div className="text-text/60 flex items-center gap-1.5 text-sm">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-4 w-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>

                                            <span>
                                                {formatDateTime(
                                                    burrow.beginningTime,
                                                    burrow.endTime
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col items-center justify-between gap-2 md:flex-row">
                                        <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
                                            <div className="flex flex-row gap-2">
                                                <ShareMeeting
                                                    meeting={data.burrow}
                                                />
                                                <BookmarkMeeting
                                                    isBookmarked={
                                                        data.bookmarked
                                                    }
                                                    inPast={inPast}
                                                    meetingId={data.burrow.id}
                                                />
                                            </div>

                                            {/* tags */}
                                            {tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {tags
                                                        .slice(0, 6)
                                                        .map((t) => (
                                                            <Badge
                                                                key={String(t)}
                                                            >
                                                                {String(t)}
                                                            </Badge>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* user count badges */}
                                        <div className="mt-2 flex flex-row items-center gap-2 md:mt-0">
                                            <JoinMeeting
                                                data={data}
                                                inPast={inPast}
                                            />

                                            <MeetingCapacityBadges
                                                meeting={burrow}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            {isOwner && (
                                <Card className="flex flex-row items-center gap-2">
                                    <EditMeeting meeting={burrow} />
                                    <DeleteMeeting meeting={burrow} />
                                    <BurrowFeatures inPast={inPast} />
                                </Card>
                            )}

                            {/* description */}
                            <Card title="Description">
                                <p>
                                    {burrow.description ||
                                        "No description provided."}
                                </p>
                            </Card>

                            {inMeeting && blocks.includes("CHAT") && (
                                <ChatBox meeting={data} />
                            )}

                            {/* join requests */}
                            {isModerator && <BurrowJoinRequests />}

                            {/* invites*/}
                            {isModerator && <BurrowInvites />}
                        </div>

                        <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                            {!isLoggedOut && (
                                <MeetingLocation location={burrow.location} />
                            )}

                            {inMeeting && (
                                <Card title={"Attendees"}>
                                    <ViewAttendees />
                                </Card>
                            )}

                            {inMeeting &&
                                blocks.includes("POMODORO") &&
                                data.membership && (
                                    <Pomodoro membership={data.membership} />
                                )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
