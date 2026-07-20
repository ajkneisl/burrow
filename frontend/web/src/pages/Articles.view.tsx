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
                <h1 className="figtree text-text flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    <BookOpen className="text-secondary h-8 w-8" />
                    Articles
                </h1>

                <p className="text-text/70 mt-2">
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
                            className="bg-card border-card-border rounded-2xl border p-5 shadow-sm"
                        >
                            <div className="bg-hero h-3 w-24 animate-pulse rounded" />
                            <div className="bg-hero mt-2 h-5 w-48 animate-pulse rounded" />
                            <div className="mt-3 space-y-1.5">
                                <div className="bg-hero h-3 w-full animate-pulse rounded" />
                                <div className="bg-hero h-3 w-3/4 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="border-card-border text-text/60 rounded-2xl border border-dashed p-12 text-center">
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
