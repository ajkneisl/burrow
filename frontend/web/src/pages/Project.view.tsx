import { Link, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { Archive, Calendar } from "lucide-react"
import useUser from "@features/auth/hooks/useUser.ts"
import { getMeeting } from "@features/burrows/burrows.api.ts"
import DeleteMeeting from "@features/burrows/controls/DeleteMeeting.tsx"
import { dayLabel } from "@api/util.ts"
import ChatBox from "@features/chat/components/ChatBox.tsx"
import ViewAttendees from "@features/burrows/attendees/components/ViewAttendees.tsx"
import useSync from "@features/sync/hooks/useSync.tsx"
import { BurrowFeatures } from "@features/sync/components/BurrowFeatures.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { blockStatus } from "@features/sync/sync.atom.ts"
import { Card, Hover, ViewErrors } from "@umnburrow/core"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import ShareMeeting from "@features/burrows/controls/ShareMeeting.tsx"
import BookmarkMeeting from "@features/burrows/controls/BookmarkMeeting.tsx"
import MeetingCapacityBadges from "@features/burrows/components/MeetingCapacityBadges.tsx"
import JoinMeeting from "@features/burrows/components/JoinMeeting.tsx"

/**
 * View an individual project burrow.
 *
 * @author AJ Kneisl
 */
export default function Project() {
    const { id } = useParams<{ id: string }>()

    const auth = useToken()
    const user = useUser()

    const [blocks] = useAtom(blockStatus)

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["burrow", id],
        enabled: id !== null,
        queryFn: async () => await getMeeting(id!)
    })

    useSync(data)

    const isOwner =
        auth !== "" && user !== null && user.id === data?.burrow?.ownerID
    const inProject = data?.membership?.status === "JOINED" || isOwner
    const isPastDue = (data?.burrow?.endTime ?? 0) < new Date().valueOf()
    const isLoggedOut = auth === null

    // Set meta tags for this project
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
                                    <div className="bg-text/10 h-8 w-3/4 rounded-lg" />
                                    <div className="flex items-center gap-2">
                                        <div className="bg-text/10 h-10 w-10 rounded-full" />
                                        <div className="bg-text/10 h-4 w-48 rounded" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-text/10 h-6 w-20 rounded-full" />
                                        <div className="bg-text/10 h-6 w-20 rounded-full" />
                                    </div>
                                </div>
                            </Card>

                            {/* Main content skeleton */}
                            <div className="col-span-1 space-y-6 lg:col-span-2">
                                <Card className="p-6">
                                    <div className="animate-pulse">
                                        <div className="bg-text/10 mb-3 h-5 w-32 rounded" />
                                        <div className="space-y-2">
                                            <div className="bg-text/10 h-4 w-full rounded" />
                                            <div className="bg-text/10 h-4 w-full rounded" />
                                            <div className="bg-text/10 h-4 w-3/4 rounded" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Sidebar skeleton */}
                            <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                                <Card className="p-6">
                                    <div className="animate-pulse">
                                        <div className="bg-text/10 mb-3 h-5 w-24 rounded" />
                                        <div className="bg-text/10 h-4 w-full rounded" />
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

    return (
        <main className="min-h-screen">
            {/* memo to join burrow */}
            {isLoggedOut && (
                <div className="text-text bg-primary mt-4 w-full rounded-2xl px-4 py-3 text-center shadow-md">
                    <p className="text-sm font-medium sm:text-base">
                        Interested in this Project?
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* header */}
                        <Card className="relative order-first col-span-1 p-6 md:col-span-2 lg:col-span-3">
                            <div className="flex flex-col gap-4">
                                <div className="min-w-0">
                                    {/* archive notice*/}
                                    {isPastDue && (
                                        <Hover
                                            content={
                                                "This project is past its due date."
                                            }
                                        >
                                            <div className="bg-text/10 text-text/80 mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1 text-sm font-medium">
                                                <Archive className="h-4 w-4" />

                                                <span>
                                                    This project is past due.
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
                                                Created by{" "}
                                                <span className="text-text/80 font-medium">
                                                    {data.burrowAuthorProfile
                                                        ?.name || burrowAuthor}
                                                </span>
                                            </p>
                                        </div>

                                        <span className="text-text/50 hidden md:block">
                                            —
                                        </span>

                                        {/* due date */}
                                        <div className="text-text/60 flex items-center gap-1.5 text-sm">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                Due {dayLabel(burrow.endTime)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-row items-center justify-between gap-2 md:flex-row">
                                        <div className="flex flex-row gap-2">
                                            <ShareMeeting
                                                meeting={data.burrow}
                                            />

                                            <BookmarkMeeting
                                                isBookmarked={data.bookmarked}
                                                inPast={isPastDue}
                                                meetingId={data.burrow.id}
                                            />
                                        </div>

                                        {/* team member count */}
                                        <div className="mt-2 flex flex-row items-center gap-2 md:mt-0">
                                            <JoinMeeting
                                                inPast={isPastDue}
                                                data={data}
                                            />

                                            <MeetingCapacityBadges
                                                enforceCapacity={10}
                                                burrow={burrow}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            {isOwner && (
                                <Card className="flex flex-row items-center gap-2">
                                    <DeleteMeeting meeting={burrow} />
                                    <BurrowFeatures inPast={isPastDue} />
                                </Card>
                            )}

                            {/* objective */}
                            <Card title="Objective">
                                <p>
                                    {burrow.description ||
                                        "No objective provided."}
                                </p>
                            </Card>

                            {/* class */}
                            {burrow.location && (
                                <Card title="Class">{burrow.location}</Card>
                            )}

                            {inProject && blocks.includes("CHAT") && (
                                <ChatBox burrow={data} />
                            )}
                        </div>

                        <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                            {inProject && <ViewAttendees term="Members" />}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
