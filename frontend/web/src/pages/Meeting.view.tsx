import { Link, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import useUser from "@features/auth/hooks/useUser.ts"
import { useMemo } from "react"
import { getMeeting } from "@features/groups/groups.api.ts"
import MeetingLocation from "@features/groups/components/MeetingLocation.tsx"
import DeleteMeeting from "@features/groups/components/DeleteMeeting.tsx"
import { formatDateTime } from "@api/util.ts"
import BookmarkMeeting from "@features/groups/components/BookmarkMeeting.tsx"
import ShareMeeting from "@features/groups/components/ShareMeeting.tsx"
import JoinMeeting from "@features/groups/components/JoinMeeting.tsx"
import MeetingCapacityBadges from "@features/groups/components/MeetingCapacityBadges.tsx"
import EditMeeting from "@features/groups/components/EditMeeting.tsx"
import ChatBox from "@features/chat/components/ChatBox.tsx"
import ViewAttendees from "@features/groups/components/ViewAttendees.tsx"
import Pomodoro from "@features/sync/components/Pomodoro.tsx"
import useSync from "@features/sync/hooks/useSync.tsx"
import { MeetingFeatures } from "@features/sync/components/MeetingFeatures.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { blockStatus } from "@features/sync/sync.atom.ts"
import { Badge, Card, Hover } from "@umnburrow/core"

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
        queryFn: () => (id ? getMeeting(id, auth) : null)
    })

    useSync(data)

    // if the user is the owner
    const isOwner = useMemo(
        () => auth !== "" && user !== null && user.id === data?.meeting?.owner,
        [auth, data?.meeting?.owner, user]
    )

    // if the user is in the meeting
    const inMeeting = useMemo(
        () => data?.membership?.status === "JOINED" || isOwner,
        [data?.membership?.status, isOwner]
    )

    // if the meeting is in the past
    const inPast = useMemo(
        () => (data?.meeting?.endTime ?? 0) < new Date().valueOf(),
        [data?.meeting?.endTime]
    )

    // if the user isn't logged in
    const isLoggedOut = useMemo(() => auth === null, [auth])

    if (isLoading)
        return (
            <main className="min-h-screen bg-card-background/70 animate-pulse px-4 py-8 md:px-8">
                <div className="space-y-4">
                    <div className="h-10 w-2/3 rounded-lg bg-text/10" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="h-64 rounded-2xl bg-text/10" />
                        <div className="h-64 rounded-2xl bg-text/10 lg:col-span-2" />
                    </div>
                </div>
            </main>
        )

    if (error || !data || !id)
        return (
            <main className="min-h-screen bg-background text-text px-4 py-8 md:px-8">
                <div
                    role="alert"
                    className="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error"
                >
                    Error loading meeting.
                </div>
            </main>
        )

    const { meeting, meetingAuthor } = data

    const tags = Array.from(meeting.tags ?? [])

    return (
        <main className="min-h-screen">
            {/* memo to join burrow */}
            {isLoggedOut && (
                <div className="w-full text-text bg-primary shadow-md py-3 px-4 text-center rounded-2xl mt-4">
                    <p className="text-sm sm:text-base font-medium">
                        Interested in this Burrow?
                        <br />
                        <Link
                            to="/welcome"
                            className="mt-4 hover:text-text/40 underline underline-offset-4 font-semibold transition-colors"
                        >
                            Join Burrow Today
                        </Link>
                    </p>
                </div>
            )}

            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Card className="relative p-6">
                                <div className="flex flex-col gap-4">
                                    <div className="min-w-0">
                                        {/* archive notice*/}
                                        {inPast && (
                                            <Hover
                                                content={
                                                    "You may not edit or interact with this meeting."
                                                }
                                            >
                                                <div className="cursor-pointer mt-2 inline-flex items-center gap-2 rounded-md bg-text/10 px-3 py-1 text-sm font-medium text-text/80">
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

                                        {/* title*/}
                                        <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-text md:text-3xl">
                                            {meeting.title}
                                        </h1>

                                        {/* date */}
                                        <p className="mt-1 text-sm text-text/70">
                                            {formatDateTime(
                                                meeting.beginningTime,
                                                meeting.endTime
                                            )}
                                        </p>

                                        {/* host / author */}
                                        <p className="mb-2 mt-1 text-sm text-text/60">
                                            Hosted by{" "}
                                            <span className="font-medium text-text/80">
                                                {meetingAuthor}
                                            </span>
                                        </p>

                                        {/* tags */}
                                        {tags.length > 0 && (
                                            <div className="mt-6 flex flex-wrap gap-2">
                                                {tags.slice(0, 6).map((t) => (
                                                    <Badge key={String(t)}>
                                                        {String(t)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <ShareMeeting meeting={data.meeting} />

                                        {!isLoggedOut && (
                                            <BookmarkMeeting
                                                isBookmarked={
                                                    data?.bookmarked === true
                                                }
                                                inPast={inPast}
                                                meetingId={id}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* user count badges */}
                                <div className="pointer-events-none absolute bottom-4 right-4 flex gap-2">
                                    <MeetingCapacityBadges meeting={meeting} />
                                </div>
                            </Card>

                            {inMeeting && blocks.includes("CHAT") && (
                                <ChatBox meeting={data} />
                            )}
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <div className="flex flex-row gap-2">
                                {isOwner ? (
                                    <>
                                        <EditMeeting meeting={meeting} />
                                        <DeleteMeeting meeting={meeting} />
                                        <MeetingFeatures inPast={inPast} />
                                    </>
                                ) : (
                                    <JoinMeeting data={data} inPast={inPast} />
                                )}
                            </div>

                            <Card title="Description">
                                {meeting.description ||
                                    "No description provided."}
                            </Card>

                            {!isLoggedOut && (
                                <MeetingLocation location={meeting.location} />
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
