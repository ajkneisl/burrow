import { getClub } from "@umnburrow/core/api"
import type { ClubResponse } from "@umnburrow/core/api"
import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"
import useToken from "@features/auth/hooks/useToken.ts"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"
import ClubBanner from "@features/clubs/components/ClubBanner.tsx"
import { Card, ViewErrors } from "@umnburrow/core"
import JoinClubButton from "@features/clubs/components/JoinClubButton.tsx"
import ClubDetails from "@features/clubs/components/ClubDetails.tsx"
import ClubMeetings from "@features/clubs/components/ClubMeetings.tsx"
import ClubSkeleton from "@features/clubs/components/ClubSkeleton.tsx"
import ClubMembers from "@features/clubs/components/ClubMembers.tsx"
import ClubModeration from "@features/clubs/components/ClubModeration.tsx"

/**
 * The club screen.
 *
 * @author AJ Kneisl
 */
export default function ClubView() {
    const { name } = useParams<{ name: string }>()
    const auth = useToken()

    const { data, isLoading, error, refetch } = useQuery<ClubResponse>({
        queryKey: ["club", name],
        enabled: auth !== "" && !!name,
        queryFn: async () => await getClub(name!)
    })

    useMetaTags({
        title: `Burrow — ${data?.club?.displayName ?? "Club"}`,
        description: `View ${data?.club?.displayName ?? "this club"} on Burrow`,
        url: `https://umn.app/club/${name}`,
        image: "https://umn.app/burrow.png"
    })

    // Loading skeleton
    if (isLoading) {
        return <ClubSkeleton />
    }

    if (error || !data || !name) {
        return (
            <div className="mt-4 flex items-center justify-center">
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            </div>
        )
    }

    const { club } = data

    return (
        <main className="min-h-screen">
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Header */}
                        <Card className="relative order-first col-span-1 overflow-hidden p-0 md:col-span-2 lg:col-span-3">
                            <ClubBanner
                                clubID={club.id}
                                clubName={name}
                            />

                            <div className="flex flex-col gap-4 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="-mt-12">
                                        <ClubProfilePicture
                                            clubID={club.id}
                                            displayName={club.displayName}
                                            clubName={name}
                                            size="lg"
                                        />
                                    </div>

                                    <div className="min-w-0 pt-1">
                                        <span className="text-text/ 50 text-xs font-medium tracking-wider uppercase">
                                            {club.category}
                                        </span>

                                        <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-text md:text-3xl">
                                            {club.displayName}
                                        </h1>
                                        <p className="text-sm font-medium text-text/40">
                                            /club/{club.name}
                                        </p>

                                        <div className="mt-1 flex items-center gap-1.5 text-sm text-text/60">
                                            <Users className="size-4" />
                                            <span>
                                                {data.memberCount} member
                                                {data.memberCount !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row flex-wrap items-center gap-2">
                                    <JoinClubButton
                                        clubName={name}
                                    />

                                    <ClubModeration
                                        club={club}
                                        clubName={name}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Main content */}
                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            <ClubDetails
                                description={club.description}
                                links={club.links}
                            />

                            <ClubMeetings
                                clubName={name!}
                                clubID={club.id}
                                role={data.membership?.role}
                            />
                        </div>

                        {/* Sidebar — Members */}
                        <div className="-order-1 col-span-1 space-y-6 md:order-2">
                            <ClubMembers
                                clubName={name!}
                            />
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
