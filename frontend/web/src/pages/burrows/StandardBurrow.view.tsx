import { Link, Navigate, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Archive, Clock, GraduationCap, Repeat } from "lucide-react"
import useUser from "@features/auth/hooks/useUser.ts"
import { getBurrow } from "@features/burrows/burrows.api.ts"
import BurrowLocation from "@features/burrows/components/BurrowLocation.tsx"
import DeleteBurrow from "@features/burrows/controls/DeleteBurrow.tsx"
import { formatDateTime } from "@api/util.ts"
import JoinBurrow from "@features/burrows/components/JoinBurrow.tsx"
import BurrowCapacity from "@features/burrows/components/BurrowCapacity.tsx"
import EditBurrow from "@features/burrows/controls/EditBurrow.tsx"
import ChatBox from "@features/chat/components/ChatBox.tsx"
import ViewAttendees from "@features/burrows/attendees/components/ViewAttendees.tsx"
import Pomodoro from "@features/sync/components/Pomodoro.tsx"
import useSync from "@features/sync/hooks/useSync.tsx"
import { BurrowFeatures } from "@features/sync/components/BurrowFeatures.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { blockStatus } from "@features/sync/sync.atom.ts"
import { Badge, Card, Hover, ViewErrors } from "@umnburrow/core"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"
import ShareMeeting from "@features/burrows/controls/ShareMeeting.tsx"
import BookmarkMeeting from "@features/burrows/controls/BookmarkMeeting.tsx"
import ReportBurrow from "@features/burrows/controls/ReportBurrow.tsx"
import {
    getReoccurringText,
    NOT_REOCCURRING
} from "@features/burrows/burrows.types.tsx"

/**
 * View an individual meeting.
 *
 * @author AJ Kneisl
 */
export default function StandardBurrow() {
    const { id } = useParams<{ id: string }>()

    const nav = useNavigate()
    const auth = useToken()
    const user = useUser()

    const [blocks] = useAtom(blockStatus)

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["burrow", id],
        enabled: auth !== "" && id !== null,
        queryFn: async () => await getBurrow(id!)
    })

    useSync(data?.burrow?.id ?? null, data?.membership?.status === "JOINED")

    const isOwner =
        auth !== "" && user !== null && user.id === data?.burrow?.ownerID
    const inMeeting = data?.membership?.status === "JOINED" || isOwner
    const inPast = (data?.burrow?.endTime ?? 0) < new Date().valueOf()
    const isLoggedOut = auth === null
    const isReoccurring = data?.burrow?.reoccurring !== NOT_REOCCURRING

    // set meta tags for this meeting
    useMetaTags({
        title: `Burrow — ${data?.burrow?.title}`,
        description: `View ${data?.burrow?.title} on Burrow`,
        url: `https://umn.app/${id}`,
        image: "https://umn.app/burrow.png"
    })

    if (isLoading)
        return (
            <main className="min-h-screen">
                <section className="relative isolate">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Header skeleton */}
                            <Card className="order-first col-span-1 p-6 lg:col-span-3">
                                <div className="animate-pulse space-y-4">
                                    <div className="h-8 w-3/4 rounded-lg bg-text/10" />
                                    <div className="flex items-center gap-2">
                                        <div className="size-10 rounded-full bg-text/10" />
                                        <div className="h-4 w-48 rounded bg-text/10" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 rounded-full bg-text/10" />
                                        <div className="h-6 w-20 rounded-full bg-text/10" />
                                        <div className="h-6 w-20 rounded-full bg-text/10" />
                                    </div>
                                </div>
                            </Card>

                            {/* Main content skeleton */}
                            <div className="col-span-1 space-y-6 lg:col-span-2">
                                <Card className="p-6">
                                    <div className="animate-pulse">
                                        <div className="mb-3 h-5 w-32 rounded bg-text/10" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-full rounded bg-text/10" />
                                            <div className="h-4 w-full rounded bg-text/10" />
                                            <div className="h-4 w-3/4 rounded bg-text/10" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Sidebar skeleton */}
                            <div className="-order-1 col-span-1 space-y-6 md:order-2">
                                <Card className="p-6">
                                    <div className="animate-pulse">
                                        <div className="mb-3 h-5 w-24 rounded bg-text/10" />
                                        <div className="h-4 w-full rounded bg-text/10" />
                                    </div>
                                </Card>
                                <Card className="p-6">
                                    <div className="animate-pulse">
                                        <div className="mb-3 h-5 w-32 rounded bg-text/10" />
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="size-10 rounded-full bg-text/10" />
                                                <div className="h-4 w-32 rounded bg-text/10" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-10 rounded-full bg-text/10" />
                                                <div className="h-4 w-32 rounded bg-text/10" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-10 rounded-full bg-text/10" />
                                                <div className="h-4 w-32 rounded bg-text/10" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        )

    if (error || !data || !id)
        return (
            <div className="mt-4 flex items-center justify-center">
                <div>
                    <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
                </div>
            </div>
        )

    const { burrow, burrowAuthor } = data

    // Redirect to project page if this is a project burrow
    if (burrow.kind === "PROJECT") {
        return <Navigate to={`/project/${id}`} replace />
    }

    const tags = Array.from(burrow.tags ?? [])

    return (
        <main className="min-h-screen">
            {/* memo to join burrow */}
            {isLoggedOut && (
                <div className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-center text-text shadow-md">
                    <p className="text-sm font-medium sm:text-base">
                        Interested in this Burrow?
                        <br />
                        <Link
                            to="/welcome"
                            className="mt-4 font-semibold underline underline-offset-4 transition-colors hover:text-text/40"
                        >
                            Join Burrow Today
                        </Link>
                    </p>
                </div>
            )}

            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* header */}
                        <Card className="relative order-first col-span-1 p-6 md:col-span-2 lg:col-span-3">
                            <div className="flex flex-col gap-4">
                                <div className="min-w-0">
                                    {/* archive notice*/}
                                    {inPast && (
                                        <Hover
                                            content={
                                                "You may not edit or interact with this meeting."
                                            }
                                        >
                                            <div className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md bg-text/10 px-3 py-1 text-sm font-medium text-text/80">
                                                <Archive className="size-4" />
                                                <span>
                                                    This meeting is archived
                                                </span>
                                            </div>
                                        </Hover>
                                    )}

                                    {/* title */}
                                    <h1 className="mt-3 truncate text-xl font-bold tracking-tight text-text md:text-3xl">
                                        {burrow.title}
                                    </h1>

                                    <div className="my-1 flex flex-col-reverse items-center gap-2 text-sm md:flex-row">
                                        {/* host / author */}
                                        {data.clubName && burrow.clubID ? (
                                            <div
                                                role="button"
                                                onClick={() =>
                                                    nav(
                                                        `/club/${data.clubName}`
                                                    )
                                                }
                                                className="flex cursor-pointer flex-row items-center gap-2"
                                            >
                                                <ClubProfilePicture
                                                    clubID={burrow.clubID}
                                                    displayName={
                                                        data.clubDisplayName ??
                                                        ""
                                                    }
                                                    clubName={data.clubName}
                                                    size="sm"
                                                />
                                                <p className="text-sm text-text/60">
                                                    Hosted by{" "}
                                                    <span className="font-medium text-text/80">
                                                        {data.clubDisplayName}
                                                    </span>
                                                </p>
                                            </div>
                                        ) : (
                                            <div
                                                role="button"
                                                onClick={() =>
                                                    nav(
                                                        `/user/${data?.burrowAuthor}`
                                                    )
                                                }
                                                className="flex cursor-pointer flex-row items-center gap-2"
                                            >
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
                                                <p className="text-sm text-text/60">
                                                    Hosted by{" "}
                                                    <span className="font-medium text-text/80">
                                                        {data
                                                            .burrowAuthorProfile
                                                            ?.name ||
                                                            burrowAuthor}
                                                    </span>
                                                </p>

                                                {/* TA badge */}
                                                {data.hostedByTa && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info ring-1 ring-info/30 ring-inset">
                                                        <GraduationCap className="size-3" />
                                                        TA
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <span className="hidden text-text/50 md:block">
                                            —
                                        </span>

                                        {/* date */}
                                        <div className="flex items-center gap-1.5 text-sm text-text/60">
                                            {isReoccurring ? (
                                                <Repeat className="size-4" />
                                            ) : (
                                                <Clock className="size-4" />
                                            )}

                                            <Hover
                                                content={getReoccurringText(
                                                    burrow.reoccurring
                                                )}
                                            >
                                                <span>
                                                    {formatDateTime(
                                                        burrow.beginningTime,
                                                        burrow.endTime
                                                    )}
                                                </span>
                                            </Hover>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-row items-center justify-between gap-2 md:flex-row">
                                        <div className="flex flex-row gap-2">
                                            <ShareMeeting
                                                meeting={data.burrow}
                                            />

                                            <BookmarkMeeting
                                                isBookmarked={data.bookmarked}
                                                inPast={inPast}
                                                meetingId={data.burrow.id}
                                            />

                                            {!isOwner && (
                                                <ReportBurrow
                                                    burrowID={data.burrow.id}
                                                    burrowTitle={
                                                        data.burrow.title
                                                    }
                                                    authorID={
                                                        data.burrow.ownerID
                                                    }
                                                    authorName={
                                                        data
                                                            ?.burrowAuthorProfile
                                                            ?.name ??
                                                        "Burrow Author"
                                                    }
                                                />
                                            )}
                                        </div>

                                        {/* user count badges */}
                                        <div className="mt-2 flex flex-row items-center gap-2 md:mt-0">
                                            <JoinBurrow
                                                data={data}
                                                inPast={inPast}
                                            />

                                            <BurrowCapacity burrow={burrow} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            {isOwner && (
                                <Card className="flex flex-row items-center gap-2">
                                    <EditBurrow burrow={burrow} />
                                    <DeleteBurrow burrow={burrow} />
                                    <BurrowFeatures inPast={inPast} />
                                </Card>
                            )}

                            {/* description */}
                            <Card title="Description">
                                <p>
                                    {burrow.description ||
                                        "No description provided."}
                                </p>

                                {/* tags */}
                                {tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {tags.slice(0, 6).map((t) => (
                                            <Badge key={String(t)}>
                                                {String(t)}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {inMeeting && blocks.includes("CHAT") && (
                                <ChatBox burrow={data} />
                            )}
                        </div>

                        <div className="-order-1 col-span-1 space-y-6 md:order-2">
                            {!isLoggedOut && (
                                <BurrowLocation location={burrow.location} />
                            )}

                            {inMeeting && <ViewAttendees />}

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
