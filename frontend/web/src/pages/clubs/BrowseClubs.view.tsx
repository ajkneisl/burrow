import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Compass, Users, Search } from "lucide-react"
import clsx from "clsx"
import useToken from "@features/auth/hooks/useToken.ts"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import { discoverClubs, getMyClubs } from "@features/clubs/clubs.api.ts"
import type { Club, ClubCategory } from "@features/clubs/clubs.types.tsx"
import { Card, Paginator, ViewErrors } from "@umnburrow/core"
import { CDN_URL } from "@api/util.ts"

const CATEGORIES: { label: string; value: ClubCategory | null }[] = [
    { label: "All", value: null },
    { label: "Sports", value: "SPORTS" },
    { label: "Social", value: "SOCIAL" },
    { label: "Creative", value: "CREATIVE" },
    { label: "Educational", value: "EDUCATIONAL" }
]

function categoryColor(category: ClubCategory): string {
    switch (category) {
        case "SPORTS":
            return "bg-green-100 text-green-800"
        case "SOCIAL":
            return "bg-blue-100 text-blue-800"
        case "CREATIVE":
            return "bg-purple-100 text-purple-800"
        case "EDUCATIONAL":
            return "bg-amber-100 text-amber-800"
    }
}

function ClubAvatar({ club }: { club: Club }) {
    const [error, setError] = useState(false)
    const initials = club.displayName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")

    if (error) {
        return (
            <div className="bg-hero text-text/60 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {initials}
            </div>
        )
    }

    return (
        <img
            src={`${CDN_URL}/avatars/club/${club.id}/avatar`}
            alt={club.displayName}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
            onError={() => setError(true)}
        />
    )
}

export default function BrowseClubs() {
    const nav = useNavigate()
    const auth = useToken()
    const [category, setCategory] = useState<ClubCategory | null>(null)
    const [page, setPage] = useState(1)

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["clubs", "discover", category, page],
        enabled: auth !== "",
        queryFn: async () => await discoverClubs(page, category ?? undefined)
    })

    const { data: myClubs } = useQuery({
        queryKey: ["myClubs"],
        enabled: auth !== "",
        queryFn: async () => await getMyClubs()
    })

    const myClubIds = useMemo(
        () => new Set((myClubs ?? []).map((c) => c.club.id)),
        [myClubs]
    )

    useMetaTags({
        title: "Burrow — Browse Clubs",
        description: "Discover clubs on Burrow",
        url: "https://umn.app/clubs/browse",
        image: "https://umn.app/burrow.png"
    })

    const clubs = data?.contents ?? []

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-text text-3xl font-bold">
                        Browse Clubs
                    </h1>
                    <p className="text-text/60 mt-1 text-sm">
                        Discover clubs to join
                    </p>
                </div>

                {/* Category filters */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.label}
                            onClick={() => {
                                setCategory(cat.value)
                                setPage(1)
                            }}
                            className={clsx(
                                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                                category === cat.value
                                    ? "border-primary bg-primary text-white"
                                    : "border-border text-text/60 hover:border-primary hover:text-text"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {isLoading && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-text/10 h-12 w-12 shrink-0 animate-pulse rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="bg-text/10 h-5 w-40 animate-pulse rounded" />
                                        <div className="bg-text/10 h-4 w-full animate-pulse rounded" />
                                        <div className="bg-text/10 h-4 w-16 animate-pulse rounded-full" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center justify-center">
                        <ViewErrors
                            errors={[`${error}`]}
                            clearErrors={refetch}
                        />
                    </div>
                )}

                {!isLoading && !error && clubs.length === 0 && (
                    <Card className="p-8">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <Compass className="text-text/20 h-12 w-12" />
                            <p className="text-text/60 text-sm">
                                No clubs found
                            </p>
                            <p className="text-text/40 text-xs">
                                Try changing your filters
                            </p>
                        </div>
                    </Card>
                )}

                {!isLoading && clubs.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {clubs.map((club) => (
                                <Card
                                    key={club.id}
                                    className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                                    onClick={() => nav(`/club/${club.name}`)}
                                >
                                    <div className="flex items-start gap-4">
                                        <ClubAvatar club={club} />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-text truncate font-semibold">
                                                    {club.displayName}
                                                </h3>
                                                {myClubIds.has(club.id) && (
                                                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                        Joined
                                                    </span>
                                                )}
                                            </div>

                                            {club.description && (
                                                <p className="text-text/60 mt-1 line-clamp-2 text-sm">
                                                    {club.description}
                                                </p>
                                            )}

                                            <span
                                                className={clsx(
                                                    "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                                    categoryColor(
                                                        club.category
                                                    )
                                                )}
                                            >
                                                {club.category
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    club.category
                                                        .slice(1)
                                                        .toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {data && (
                            <Paginator
                                currentPage={page}
                                totalPages={data.totalPages}
                                totalResults={data.totalResults}
                                onPageChange={setPage}
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    )
}