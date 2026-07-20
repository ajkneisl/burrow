import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import type { Article } from "@features/articles/articles.types.ts"

/**
 * A card previewing a single article, linking to its full page.
 *
 * @param article The article to preview.
 */
export default function ArticleCard({ article }: { article: Article }) {
    const date = new Date(article.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    })

    return (
        <Link
            to={`/article/${article.slug}`}
            className="group border-card-border bg-card hover:border-secondary/40 flex flex-col rounded-2xl border p-5 shadow-sm transition-colors"
        >
            <p className="text-text/50 text-xs font-medium">{date}</p>

            <h2 className="text-text group-hover:text-secondary mt-1 text-xl font-bold tracking-tight transition-colors">
                {article.title}
            </h2>

            {article.description && (
                <p className="text-text/70 mt-2 line-clamp-3 text-sm leading-relaxed">
                    {article.description}
                </p>
            )}

            <span className="text-secondary mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                Read
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
        </Link>
    )
}
