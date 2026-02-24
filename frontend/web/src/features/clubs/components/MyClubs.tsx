import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Crown, Shield, Users } from "lucide-react"
import { Card } from "@umnburrow/core"
import { getMyClubs } from "@features/clubs/clubs.api.ts"
import type { ClubRole, MyClubResponse } from "@features/clubs/clubs.types.ts"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"

/**
 * Sidebar widget showing the user's clubs on the homepage.
 *
 * @author AJ Kneisl
 */
export default function MyClubs() {
    const nav = useNavigate()

    const { data, isLoading } = useQuery<MyClubResponse[]>({
        queryKey: ["myClubs"],
        queryFn: async () => await getMyClubs()
    })

    const clubs = data ?? []

    return (
        <Card className="border-text/10 flex flex-col gap-4 rounded-xl border p-4 shadow-md">
            <div className="flex items-center justify-between">
                <h2 className="text-text/60 figtree text-[11px] tracking-wider uppercase">
                    My Clubs
                </h2>

                <button
                    onClick={() => nav("/clubs")}
                    className="text-text/60 hover:text-text/80 cursor-pointer text-xs hover:underline"
                >
                    View all
                </button>
            </div>

            <ul className="space-y-2">
                {/* loading skeleton */}
                {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <li
                            key={i}
                            className="bg-background/30 flex items-center gap-3 rounded-lg px-3 py-2.5"
                        >
                            <div className="bg-text/10 size-8 animate-pulse rounded-full" />
                            <div className="flex-1">
                                <div className="bg-text/10 h-3.5 w-28 animate-pulse rounded" />
                            </div>
                        </li>
                    ))}

                {/* club list */}
                {!isLoading &&
                    clubs.slice(0, 4).map((item) => (
                        <li
                            key={item.club.id}
                            onClick={() => nav(`/club/${item.club.name}`)}
                            className="group bg-background/30 hover:bg-background/60 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                        >
                            <ClubProfilePicture
                                clubID={item.club.id}
                                displayName={item.club.displayName}
                                clubName={item.club.name}
                                size="sm"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="text-text truncate text-sm font-medium">
                                    {item.club.displayName}
                                </p>
                            </div>

                            <RoleIndicator role={item.membership.role} />
                        </li>
                    ))}

                {/* empty state */}
                {!isLoading && clubs.length === 0 && (
                    <li className="bg-background/30 flex flex-col items-center gap-1 rounded-lg px-4 py-6">
                        <Users className="text-text/30 h-6 w-6" />
                        <p className="text-text/40 text-sm">No clubs yet</p>
                    </li>
                )}
            </ul>
        </Card>
    )
}

function RoleIndicator({ role }: { role: ClubRole }) {
    if (role === "ADMINISTRATOR") {
        return <Crown className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
    }

    if (role === "MODERATOR") {
        return <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
    }

    return null
}
