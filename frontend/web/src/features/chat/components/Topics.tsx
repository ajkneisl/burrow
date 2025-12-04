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
                        className="hover:underline cursor-pointer text-sm font-semibold"
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
                                className="hover:bg-background/50 flex cursor-pointer items-center gap-2 rounded p-2"
                            >
                                {topic.pinned && (
                                    <Pin className="text-text/40 h-3 w-3 shrink-0" />
                                )}

                                <h3 className="text-text truncate text-sm">
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
                            <div className="bg-text/10 h-3 flex-1 animate-pulse rounded" />
                        </div>
                    ))}

                {/* Empty state */}
                {!isLoading && data && data.length === 0 && (
                    <div className="text-text/50 flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="mb-3 h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">No topics yet</p>
                        <p className="text-text/40 mt-1 text-xs">
                            Be the first to start a discussion
                        </p>
                    </div>
                )}

                {/* View all link */}
                {topicsToShow.length > 0 && (
                    <button
                        onClick={() => nav("/discuss")}
                        className="text-secondary hover:text-secondary/80 mt-1 flex cursor-pointer items-center justify-center gap-1 text-sm font-medium transition-colors"
                    >
                        View all discussions
                        <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </Card>
    )
}
