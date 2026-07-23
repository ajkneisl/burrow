import {useState, useMemo} from "react"
import {useNavigate} from "react-router"
import {useQuery} from "@tanstack/react-query"
import {Compass} from "lucide-react"
import clsx from "clsx"
import useToken from "@features/auth/hooks/useToken.ts"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import {discoverClubs, getMyClubs} from "@features/clubs/clubs.api.ts"
import type {Club, ClubCategory} from "@features/clubs/clubs.types.tsx"
import {Card, Chip, Paginator, ViewErrors} from "@umnburrow/core"
import {CDN_URL} from "@api/util.ts"
import BrowseTabs from "@features/browse/components/BrowseTabs.tsx"

const CATEGORIES: { label: string; value: ClubCategory | null }[] = [
    {label: "All", value: null},
    {label: "Sports", value: "SPORTS"},
    {label: "Social", value: "SOCIAL"},
    {label: "Creative", value: "CREATIVE"},
    {label: "Educational", value: "EDUCATIONAL"}
]

const CATEGORY_CHIP_COLOR: Record<ClubCategory, "success" | "info" | "primary" | "warning"> = {
    SPORTS: "success",
    SOCIAL: "info",
    CREATIVE: "primary",
    EDUCATIONAL: "warning"
}

function ClubBannerImage({club}: { club: Club }) {
    const [error, setError] = useState(false)

    if (error) {
        return (
            <div className="from-primary/20 to-primary/5 h-full w-full bg-gradient-to-br"/>
        )
    }

    return (
        <img
            src={`${CDN_URL}/avatars/club/${club.id}/banner`}
            alt={`${club.displayName} banner`}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
        />
    )
}

function ClubAvatar({club}: { club: Club }) {
    const [error, setError] = useState(false)
    const initials = club.displayName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")

    if (error) {
        return (
            <div
                className="bg-hero text-text/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ring-card">
                {initials}
            </div>
        )
    }

    return (
        <img
            src={`${CDN_URL}/avatars/club/${club.id}/avatar`}
            alt={club.displayName}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-card"
            onError={() => setError(true)}
        />
    )
}

export default function BrowseClubs() {
    const nav = useNavigate()
    const auth = useToken()
    const [category, setCategory] = useState<ClubCategory | null>(null)
    const [page, setPage] = useState(1)

    const {data, isLoading, error, refetch} = useQuery({
        queryKey: ["clubs", "discover", category, page],
        enabled: auth !== "",
        queryFn: async () => await discoverClubs(page, category ?? undefined)
    })

    const {data: myClubs} = useQuery({
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
        <section className="mx-auto w-full max-w-7xl">
            <section className="mx-auto w-full max-w-4xl p-4 sm:p-6">
                <BrowseTabs />

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
                        {Array.from({length: 6}).map((_, i) => (
                            <div
                                key={i}
                                className="bg-card border-card-border overflow-hidden rounded-2xl border shadow-sm"
                            >
                                <div className="bg-hero h-28 w-full animate-pulse"/>
                                <div className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-hero -mt-8 h-10 w-10 animate-pulse rounded-full"/>
                                        <div className="flex-1 space-y-2">
                                            <div className="bg-hero h-5 w-40 animate-pulse rounded"/>
                                            <div className="bg-hero h-3 w-full animate-pulse rounded"/>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <div className="bg-hero h-6 w-16 animate-pulse rounded-full"/>
                                    </div>
                                </div>
                            </div>
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
                            <Compass className="text-text/20 h-12 w-12"/>
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
                                    isHoverable
                                    className="!p-0 overflow-hidden"
                                    onClick={() => nav(`/club/${club.name}`)}
                                >
                                    {/* Banner */}
                                    <div className="h-28 w-full overflow-hidden">
                                        <ClubBannerImage club={club}/>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            {/* Avatar overlapping the banner */}
                                            <div className="-mt-8 shrink-0">
                                                <ClubAvatar club={club}/>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-text truncate font-semibold tracking-tight">
                                                        {club.displayName}
                                                    </h3>

                                                    {myClubIds.has(club.id) && (
                                                        <p className="text-text/40 inline-flex items-center text-xs">
                                                            Joined
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {club.description && (
                                            <p className="text-text/60 mt-2 line-clamp-2 text-sm">
                                                {club.description}
                                            </p>
                                        )}

                                        <div className="mt-3 flex items-center gap-1.5">
                                            <Chip
                                                size="md"
                                                color={CATEGORY_CHIP_COLOR[club.category]}
                                            >
                                                {club.category.charAt(0).toUpperCase() +
                                                    club.category.slice(1).toLowerCase()}
                                            </Chip>
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
            </section>
        </section>
    )
}
