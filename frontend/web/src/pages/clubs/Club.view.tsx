import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Users, Pencil, UserPlus } from "lucide-react"
import useUser from "@features/auth/hooks/useUser.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import { getClub } from "@features/clubs/clubs.api.ts"
import type { ClubResponse } from "@features/clubs/clubs.types.ts"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"
import ClubBanner from "@features/clubs/components/ClubBanner.tsx"
import EditClubModal from "@features/clubs/components/EditClubModal.tsx"
import InviteClubMemberModal from "@features/clubs/components/InviteClubMemberModal.tsx"
import { Button, Card, ViewErrors } from "@umnburrow/core"
import { useState } from "react"
import JoinClubButton from "@features/clubs/components/JoinClubButton.tsx"
import ClubMeetings from "@features/clubs/components/ClubMeetings.tsx"
import ClubSkeleton from "@features/clubs/components/ClubSkeleton.tsx"
import ClubMembers from "@features/clubs/components/ClubMembers.tsx"

/**
 * The club screen.
 *
 * @author AJ Kneisl
 */
export default function ClubView() {
    const { name } = useParams<{ name: string }>()
    const auth = useToken()
    const user = useUser()

    const [editOpen, setEditOpen] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)

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

    const isOwner = user !== null && user.id === data?.club?.ownerID
    const isMember = data?.membership !== null
    const isAdmin = data?.membership?.role === "ADMINISTRATOR" || isOwner
    const isMod = isAdmin || data?.membership?.role === "MODERATOR"

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
                                editable={isAdmin}
                            />

                            <div className="flex flex-col gap-4 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="-mt-12">
                                        <ClubProfilePicture
                                            clubID={club.id}
                                            displayName={club.displayName}
                                            clubName={name}
                                            size="lg"
                                            editable={isAdmin}
                                        />
                                    </div>

                                    <div className="min-w-0 pt-1">
                                        <span className="text-text/ 50 text-xs font-medium tracking-wider uppercase">
                                            {club.category}
                                        </span>

                                        <h1 className="text-text mt-1 truncate text-xl font-bold tracking-tight md:text-3xl">
                                            {club.displayName}
                                        </h1>
                                        <p className="text-text/40 text-sm font-medium">
                                            /club/{club.name}
                                        </p>

                                        <div className="text-text/60 mt-1 flex items-center gap-1.5 text-sm">
                                            <Users className="h-4 w-4" />
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
                                <div className="flex flex-row items-center gap-2">
                                    <JoinClubButton
                                        clubName={name}
                                        isMember={isMember}
                                        isOwner={isOwner}
                                        requestedToJoin={
                                            data.requestedToJoin ?? false
                                        }
                                        requestToJoin={
                                            club.requestToJoin ?? false
                                        }
                                        hasUser={!!user}
                                    />

                                    {isAdmin && (
                                        <Button
                                            color="SECONDARY"
                                            onClick={() => setEditOpen(true)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                    )}

                                    {isMod && (
                                        <Button
                                            color="INFO"
                                            onClick={() => setInviteOpen(true)}
                                        >
                                            <UserPlus className="h-3.5 w-3.5" />
                                            Invite
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Main content */}
                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            {/* Description */}
                            <Card title="About">
                                <p className="text-text/80 whitespace-pre-wrap">
                                    {club.description ||
                                        "No description provided."}
                                </p>
                            </Card>

                            <ClubMeetings clubName={name!} />
                        </div>

                        {/* Sidebar — Members */}
                        <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                            <ClubMembers
                                clubName={name!}
                                ownerID={data.club.ownerID}
                                currentUserID={user?.id}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Modals */}
            {isAdmin && (
                <EditClubModal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    club={club}
                />
            )}

            {isMod && (
                <InviteClubMemberModal
                    open={inviteOpen}
                    onClose={() => setInviteOpen(false)}
                    clubName={name}
                />
            )}
        </main>
    )
}
