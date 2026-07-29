import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input, ViewErrors } from "@umnburrow/core"
import { BookOpen } from "lucide-react"
import { getArticles } from "@features/articles/articles.api.ts"
import ArticleCard from "@features/articles/components/ArticleCard.tsx"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"

/**
 * Browse and search all published articles.
 *
 * @author AJ Kneisl
 */
export default function ArticlesView() {
    const [query, setQuery] = useState("")

    useMetaTags({
        title: "Burrow — Articles",
        description: "Read the latest articles and guides from Burrow.",
        url: "https://umn.app/articles"
    })

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["articles"],
        queryFn: getArticles,
        // articles are public; don't gate on being logged in
        enabled: true,
        refetchOnWindowFocus: false
    })

    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase()

        if (!search) return data ?? []

        return (data ?? []).filter(
            (article) =>
                article.title.toLowerCase().includes(search) ||
                article.description?.toLowerCase().includes(search)
        )
    }, [data, query])

    return (
        <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
            {/* header */}
            <div className="mb-6">
                <h1 className="figtree flex items-center gap-3 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
                    <BookOpen className="size-8 text-secondary" />
                    Articles
                </h1>

                <p className="mt-2 text-text/70">
                    Guides, updates, and stories from the Burrow team.
                </p>
            </div>

            {/* search */}
            <div className="mb-6">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles…"
                />
            </div>

            {error ? (
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            ) : isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"
                        >
                            <div className="h-3 w-24 animate-pulse rounded bg-hero" />
                            <div className="mt-2 h-5 w-48 animate-pulse rounded bg-hero" />
                            <div className="mt-3 space-y-1.5">
                                <div className="h-3 w-full animate-pulse rounded bg-hero" />
                                <div className="h-3 w-3/4 animate-pulse rounded bg-hero" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-card-border p-12 text-center text-text/60">
                    {query.trim()
                        ? `No articles match "${query.trim()}".`
                        : "No articles have been published yet."}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filtered.map((article) => (
                        <ArticleCard key={article.slug} article={article} />
                    ))}
                </div>
            )}
        </main>
    )
}
