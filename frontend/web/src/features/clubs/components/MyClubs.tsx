import { getMyClubs } from "@umnburrow/core/api"
import type { ClubRole, MyClubResponse } from "@umnburrow/core/api"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Crown, Shield, Users } from "lucide-react"
import { Card, ListItem } from "@umnburrow/core"
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
        <Card className="flex flex-col gap-4 rounded-xl border border-text/10 p-4 shadow-md">
            <div className="flex items-center justify-between">
                <h2 className="figtree text-[11px] tracking-wider text-text/60 uppercase">
                    My Clubs
                </h2>

                <button
                    onClick={() => nav("/clubs")}
                    className="cursor-pointer text-xs text-text/60 hover:text-text/80 hover:underline"
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
                            className="flex items-center gap-3 rounded-lg bg-hero/80 px-3 py-2.5"
                        >
                            <div className="size-8 animate-pulse rounded-full bg-text/10" />
                            <div className="flex-1">
                                <div className="h-3.5 w-28 animate-pulse rounded bg-text/10" />
                            </div>
                        </li>
                    ))}

                {/* club list */}
                {!isLoading &&
                    clubs.slice(0, 4).map((item) => (
                        <ListItem
                            key={item.club.id}
                            onClick={() => nav(`/club/${item.club.name}`)}
                            leading={
                                <ClubProfilePicture
                                    clubID={item.club.id}
                                    displayName={item.club.displayName}
                                    clubName={item.club.name}
                                    size="sm"
                                />
                            }
                            title={item.club.displayName}
                            trailing={<RoleIndicator role={item.membership.role} />}
                        />
                    ))}

                {/* empty state */}
                {!isLoading && clubs.length === 0 && (
                    <li className="flex flex-col items-center gap-1 rounded-lg bg-background/30 px-4 py-6">
                        <Users className="size-6 text-text/30" />
                        <p className="text-sm text-text/40">No clubs yet</p>
                    </li>
                )}
            </ul>
        </Card>
    )
}

function RoleIndicator({ role }: { role: ClubRole }) {
    if (role === "ADMINISTRATOR") {
        return <Crown className="size-3.5 shrink-0 text-yellow-500" />
    }

    if (role === "MODERATOR") {
        return <Shield className="size-3.5 shrink-0 text-indigo-400" />
    }

    return null
}
