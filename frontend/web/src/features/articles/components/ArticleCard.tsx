import type { Article } from "@umnburrow/core/api"
import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
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
            className="group flex flex-col rounded-2xl border border-card-border bg-card p-5 shadow-sm transition-colors hover:border-secondary/40"
        >
            <p className="text-xs font-medium text-text/50">{date}</p>

            <h2 className="mt-1 text-xl font-bold tracking-tight text-text transition-colors group-hover:text-secondary">
                {article.title}
            </h2>

            {article.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text/70">
                    {article.description}
                </p>
            )}

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                Read
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
        </Link>
    )
}
