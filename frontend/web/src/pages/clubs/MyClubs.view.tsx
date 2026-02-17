import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Crown, Plus, Shield, UserRound, Users } from "lucide-react"
import useToken from "@features/auth/hooks/useToken.ts"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import { getMyClubs } from "@features/clubs/clubs.api.ts"
import type { ClubRole, MyClubResponse } from "@features/clubs/clubs.types.ts"
import { Button, Card, ViewErrors } from "@umnburrow/core"
import CreateClubModal from "@features/clubs/components/CreateClubModal.tsx"
import clsx from "clsx"

function roleBadgeColor(role: ClubRole): string {
    switch (role) {
        case "ADMINISTRATOR":
            return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "MODERATOR":
            return "bg-indigo-100 text-indigo-800 border-indigo-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

function roleIcon(role: ClubRole) {
    switch (role) {
        case "ADMINISTRATOR":
            return <Crown className="h-3 w-3" />
        case "MODERATOR":
            return <Shield className="h-3 w-3" />
        default:
            return <UserRound className="h-3 w-3" />
    }
}

export default function MyClubs() {
    const nav = useNavigate()
    const auth = useToken()
    const [createOpen, setCreateOpen] = useState(false)

    const { data, isLoading, error, refetch } = useQuery<MyClubResponse[]>({
        queryKey: ["myClubs"],
        enabled: auth !== "",
        queryFn: async () => await getMyClubs()
    })

    useMetaTags({
        title: "Burrow — My Clubs",
        description: "View your clubs on Burrow",
        url: "https://umn.app/clubs",
        image: "https://umn.app/burrow.png"
    })

    if (isLoading) {
        return (
            <main className="min-h-screen">
                <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="bg-text/10 h-8 w-40 animate-pulse rounded-lg" />
                        <div className="bg-text/10 mt-2 h-4 w-24 animate-pulse rounded" />
                    </div>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="bg-text/10 h-5 w-48 animate-pulse rounded" />
                                        <div className="bg-text/10 h-3 w-32 animate-pulse rounded" />
                                    </div>
                                    <div className="bg-text/10 h-6 w-20 animate-pulse rounded-full" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <div className="mt-4 flex items-center justify-center">
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            </div>
        )
    }

    const clubs = data ?? []

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-text text-3xl font-bold">My Clubs</h1>
                        <p className="text-text/60 mt-1 text-sm">
                            {clubs.length} club{clubs.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <Button thin onClick={() => setCreateOpen(true)} color="SUCCESS">
                        <Plus className="h-4 w-4" />
                        Create Club
                    </Button>
                </div>

                {clubs.length === 0 && (
                    <Card className="p-6">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <Users className="text-text/30 h-10 w-10" />
                            <p className="text-text/60 text-sm">
                                You are not a member of any clubs yet.
                            </p>
                        </div>
                    </Card>
                )}

                {clubs.length > 0 && (
                    <div className="space-y-3">
                        {clubs.map((item) => (
                            <Card
                                key={item.club.id}
                                className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                                onClick={() => nav(`/club/${item.club.name}`)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-text truncate text-base font-semibold">
                                            {item.club.displayName}
                                        </h3>
                                        <p className="text-text/40 text-xs font-medium">
                                            /club/{item.club.name}
                                        </p>
                                        {item.club.description && (
                                            <p className="text-text/60 mt-1 line-clamp-1 text-sm">
                                                {item.club.description}
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className={clsx(
                                            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                                            roleBadgeColor(item.membership.role)
                                        )}
                                    >
                                        {roleIcon(item.membership.role)}
                                        {item.membership.roleName || item.membership.role}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <CreateClubModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </main>
    )
}
