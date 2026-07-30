import { createArticle, deleteArticle, getAllArticles, updateArticle } from "@umnburrow/core/api"
import type { Article } from "@umnburrow/core/api"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Input, TextArea, Toggle } from "@umnburrow/core"


/** An empty editor state. */
const EMPTY_DRAFT = {
    slug: "",
    title: "",
    description: "",
    content: "",
    published: false
}

/**
 * Manage articles.
 *
 * @author AJ Kneisl
 */
export default function ArticlesView() {
    const queryClient = useQueryClient()

    const { data: articles, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["admin", "articles"],
        queryFn: () => getAllArticles(),
        refetchOnWindowFocus: true
    })

    // the slug of the article being edited, or null when creating a new one
    const [editingSlug, setEditingSlug] = useState<string | null>(null)
    const [draft, setDraft] = useState(EMPTY_DRAFT)

    const startCreate = () => {
        setEditingSlug(null)
        setDraft(EMPTY_DRAFT)
    }

    const startEdit = (article: Article) => {
        setEditingSlug(article.slug)
        setDraft({
            slug: article.slug,
            title: article.title,
            description: article.description ?? "",
            content: article.content,
            published: article.published
        })
    }

    const saveMutation = useMutation({
        mutationFn: () => {
            const payload = {
                slug: draft.slug,
                title: draft.title,
                description: draft.description || null,
                content: draft.content,
                published: draft.published
            }

            return editingSlug === null
                ? createArticle(payload)
                : updateArticle(editingSlug, payload)
        },

        onSuccess: (article) => {
            setEditingSlug(article.slug)
            queryClient.invalidateQueries({ queryKey: ["admin", "articles"] })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (slug: string) => deleteArticle(slug),

        onSuccess: (_, slug) => {
            if (editingSlug === slug) startCreate()

            queryClient.invalidateQueries({ queryKey: ["admin", "articles"] })
        }
    })

    return (
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Articles</h1>

                <div className="flex gap-2">
                    <Button onClick={startCreate}>New Article</Button>

                    <Button onClick={() => refetch()}>
                        {isFetching ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* all articles */}
                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4">All Articles</h2>

                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-lg bg-primary/5"
                                />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm">
                            <div className="font-semibold text-error">
                                Failed to load articles
                            </div>

                            <div className="mt-1 text-muted-foreground">
                                {(error as Error)?.message || "Unknown error"}
                            </div>
                        </div>
                    ) : articles?.length === 0 ? (
                        <div className="rounded-lg border border-primary/10 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                            No articles created yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {articles?.map((article: Article) => (
                                <div
                                    key={article.slug}
                                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                                        editingSlug === article.slug
                                            ? "border-primary"
                                            : ""
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">
                                                {article.title}
                                            </span>

                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    article.published
                                                        ? "bg-green-500/15 text-green-600"
                                                        : "bg-muted/40 text-muted-foreground"
                                                }`}
                                            >
                                                {article.published
                                                    ? "Published"
                                                    : "Draft"}
                                            </span>
                                        </div>

                                        <div className="text-sm text-muted-foreground truncate">
                                            /article/{article.slug}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        {article.published && (
                                            <a
                                                href={`https://umn.app/article/${article.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button>View</Button>
                                            </a>
                                        )}

                                        <Button onClick={() => startEdit(article)}>
                                            Edit
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Delete article "${article.title}"?`
                                                    )
                                                ) {
                                                    deleteMutation.mutate(
                                                        article.slug
                                                    )
                                                }
                                            }}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending
                                                ? "..."
                                                : "Delete"}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* editor */}
                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingSlug === null
                            ? "Create Article"
                            : `Editing: ${editingSlug}`}
                    </h2>

                    <div className="space-y-3">
                        <Input
                            value={draft.slug}
                            onChange={(e) =>
                                setDraft({ ...draft, slug: e.target.value })
                            }
                            placeholder="Slug (e.g., getting-started)"
                            maxLength={64}
                        />

                        <div className="text-xs text-muted-foreground">
                            Lowercase letters, numbers, and hyphens only. The
                            article will be available at umn.app/article/&lt;slug&gt;.
                        </div>

                        <Input
                            value={draft.title}
                            onChange={(e) =>
                                setDraft({ ...draft, title: e.target.value })
                            }
                            placeholder="Title"
                            maxLength={255}
                        />

                        <Input
                            value={draft.description}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    description: e.target.value
                                })
                            }
                            placeholder="Description (optional, used for previews)"
                            maxLength={255}
                        />

                        <TextArea
                            value={draft.content}
                            onChange={(e) =>
                                setDraft({ ...draft, content: e.target.value })
                            }
                            placeholder="Write your article in markdown..."
                            className="min-h-96 font-mono text-sm"
                            remark="Markdown is supported."
                        />

                        <Toggle
                            title="Published"
                            description="Published articles are publicly visible."
                            checked={draft.published}
                            onChange={(published) =>
                                setDraft({ ...draft, published })
                            }
                        />

                        {saveMutation.isError && (
                            <div className="text-sm text-error">
                                {(saveMutation.error as Error)?.message ||
                                    "Failed to save article"}
                            </div>
                        )}

                        {saveMutation.isSuccess && !saveMutation.isPending && (
                            <div className="text-sm text-green-600">
                                Article saved!
                            </div>
                        )}

                        <Button
                            onClick={() => saveMutation.mutate()}
                            disabled={
                                !draft.slug ||
                                !draft.title ||
                                !draft.content ||
                                saveMutation.isPending
                            }
                        >
                            {saveMutation.isPending
                                ? "Saving..."
                                : editingSlug === null
                                  ? "Create Article"
                                  : "Save Changes"}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
