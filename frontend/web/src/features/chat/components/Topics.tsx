import { useQuery } from "@tanstack/react-query"
import { getTopics } from "@features/chat/chat.api.ts"
import { Card, ViewErrors } from "@umnburrow/core"
import { ArrowRight, MessageSquare, Pin } from "lucide-react"
import { useNavigate } from "react-router"

/**
 * A small view on the topics, visible on the home screen.
 *
 * @author AJ Kneisl
 */
export default function Topics() {
    const nav = useNavigate()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["topics"],
        queryFn: async () => await getTopics(1)
    })

    const topicsToShow = data?.slice(0, 5) || []

    return (
        <Card className="mt-4">
            <div className="flex flex-row items-center justify-between">
                <div className="mb-2 flex items-center justify-between">
                    <button
                        onClick={() => nav(`/discuss`)}
                        className="cursor-pointer text-sm font-semibold hover:underline"
                    >
                        Discuss on Burrow
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {isError && <ViewErrors errors={`${error}`} />}

                {/* Topics list */}
                {topicsToShow.length > 0 && (
                    <ul className="flex flex-col gap-1">
                        {topicsToShow.map((topic) => (
                            <li
                                role="button"
                                onClick={() => nav(`/discuss/${topic.id}`)}
                                key={topic.id}
                                className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-background/50"
                            >
                                {topic.pinned && (
                                    <Pin className="size-3 shrink-0 text-text/40" />
                                )}

                                <h3 className="truncate text-sm text-text">
                                    {topic?.name || "Loading..."}
                                </h3>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Loading skeleton */}
                {(isLoading || !data) &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 rounded p-2"
                        >
                            <div className="h-3 flex-1 animate-pulse rounded bg-text/10" />
                        </div>
                    ))}

                {/* Empty state */}
                {!isLoading && data && data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-text/50">
                        <MessageSquare className="mb-3 size-10 opacity-30" />
                        <p className="text-sm font-medium">No topics yet</p>
                        <p className="mt-1 text-xs text-text/40">
                            Be the first to start a discussion
                        </p>
                    </div>
                )}

                {/* View all link */}
                {topicsToShow.length > 0 && (
                    <button
                        onClick={() => nav("/discuss")}
                        className="mt-1 flex cursor-pointer items-center justify-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                    >
                        View all discussions
                        <ArrowRight className="size-4" />
                    </button>
                )}
            </div>
        </Card>
    )
}
