import { Link, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { getArticle } from "@features/articles/articles.api.ts"
import ArticleContent from "@features/articles/components/ArticleContent.tsx"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"

/**
 * The view of an article.
 *
 * @author AJ Kneisl
 */
export default function ArticleView() {
    const { slug = "" } = useParams()

    const { data, isLoading, isError } = useQuery({
        queryKey: ["article", slug],
        queryFn: () => getArticle(slug),
        // articles are public; don't gate on being logged in
        enabled: slug !== "",
        retry: false
    })

    const metaTags = useMemo(
        () => ({
            title: data ? `Burrow — ${data.title}` : "Burrow",
            description:
                data?.description ??
                (data ? `Read ${data.title} on Burrow.` : undefined),
            url: `https://umn.app/article/${slug}`
        }),
        [data, slug]
    )

    useMetaTags(metaTags)

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-16">
                <div className="space-y-4">
                    <div className="h-10 w-3/4 animate-pulse rounded-lg bg-card" />
                    <div className="h-4 w-1/3 animate-pulse rounded-lg bg-card" />
                    <div className="mt-8 space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-4 animate-pulse rounded-lg bg-card"
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
                <h1 className="mb-4 text-3xl font-bold text-text">
                    Article not found
                </h1>

                <p className="mb-8 text-text/70">
                    This article doesn't exist or is no longer available.
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                    Back to Home
                </Link>
            </div>
        )
    }

    return (
        <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
            <header className="mb-10">
                <h1 className="figtree mb-3 text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
                    {data.title}
                </h1>

                {data.description && (
                    <p className="text-lg text-text/70">{data.description}</p>
                )}

                <p className="mt-3 text-sm text-text/50">
                    {new Date(data.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })}
                    {data.updatedAt !== data.createdAt && (
                        <>
                            {" "}
                            · Updated{" "}
                            {new Date(data.updatedAt).toLocaleDateString(
                                undefined,
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                }
                            )}
                        </>
                    )}
                </p>
            </header>

            <ArticleContent content={data.content} />
        </article>
    )
}
