import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import { useMemo } from "react"
import { getMeeting } from "@features/groups/api/groups.api.ts"
import MeetingLocation from "@pages/meetings/components/MeetingLocation.tsx"
import DeleteMeeting from "@pages/meetings/overview/component/DeleteMeeting.tsx"
import { formatDateTime } from "@api/util.ts"
import Badge from "@components/Badge.tsx"
import BookmarkMeeting from "@pages/meetings/overview/component/BookmarkMeeting.tsx"
import ShareMeeting from "@pages/meetings/overview/component/ShareMeeting.tsx"
import JoinMeeting from "@pages/meetings/overview/component/JoinMeeting.tsx"
import MeetingCapacityBadges from "@features/groups/components/MeetingCapacityBadges.tsx"
import EditMeeting from "@pages/meetings/overview/component/EditMeeting.tsx"
import Card from "@components/Card.tsx"
import ChatBox from "@features/chat/components/ChatBox.tsx"
import ViewAttendees from "@pages/meetings/components/ViewAttendees.tsx"

/**
 * View an individual meeting.
 * @constructor
 */
export default function Meeting() {
    const { id } = useParams<{ id: string }>()

    const [auth] = useAtom(authToken)
    const user = useUser()

    const { data, isLoading, error } = useQuery({
        queryKey: [`meeting`, id],
        enabled: id !== null && auth !== null,
        queryFn: () => (id ? getMeeting(auth, id) : null)
    })

    const isOwner = useMemo(
        () =>
            auth !== "" &&
            user !== null &&
            user.googleID === data?.meeting?.owner,
        [auth, data?.meeting?.owner, user]
    )

    const inMeeting = useMemo(
        () => data?.membership?.status === "JOINED" || isOwner,
        [data?.membership?.status, isOwner]
    )

    if (isLoading)
        return (
            <main className="min-h-screen bg-[var(--card-background-color)]/70 animate-pulse px-4 py-8 md:px-8">
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
            <main className="min-h-screen bg-[var(--background-color)] text-[var(--text-color)] px-4 py-8 md:px-8">
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
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="relative rounded-3xl bg-card border border-primary/30 p-6 shadow-md">
                                <div className="flex flex-col gap-4">
                                    <div className="min-w-0">
                                        <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-text md:text-3xl">
                                            {meeting.title}
                                        </h1>

                                        <p className="mt-1 text-sm text-text/70">
                                            {formatDateTime(
                                                meeting.beginningTime,
                                                meeting.endTime
                                            )}
                                        </p>

                                        <p className="mb-2 mt-1 text-sm text-text/60">
                                            Hosted by{" "}
                                            <span className="font-medium text-text/80">
                                                {meetingAuthor}
                                            </span>
                                        </p>

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

                                        <BookmarkMeeting
                                            isBookmarked={
                                                data?.bookmarked === true
                                            }
                                            meetingId={id}
                                        />
                                    </div>
                                </div>

                                {/* user count badges */}
                                <div className="pointer-events-none absolute bottom-4 right-4 flex gap-2">
                                    <MeetingCapacityBadges meeting={meeting} />
                                </div>
                            </div>

                            {inMeeting && <ChatBox meeting={data} />}
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <div className="flex flex-row justify-evenly">
                                {isOwner ? (
                                    <>
                                        <EditMeeting meeting={meeting} />
                                        <DeleteMeeting meeting={meeting} />
                                    </>
                                ) : (
                                    <JoinMeeting data={data} />
                                )}
                            </div>

                            {inMeeting && (
                                <Card title={"Attendees"}>
                                    <ViewAttendees />
                                </Card>
                            )}

                            <Card title="Description">
                                {meeting.description ||
                                    "No description provided."}
                            </Card>

                            <MeetingLocation location={meeting.location} />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
