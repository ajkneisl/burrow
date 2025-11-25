import { useQuery } from "@tanstack/react-query"
import { getTopics } from "@features/chat/chat.api.ts"
import { Card, ViewErrors } from "@umnburrow/core"
import clsx from "clsx"
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
        <Card title="Discuss on Burrow" className="mt-4">
            <div className="flex flex-col gap-3">
                {isError && <ViewErrors errors={`${error}`} />}

                {/* Topics list */}
                {topicsToShow.length > 0 && (
                    <ul className="flex flex-col gap-2">
                        {topicsToShow.map((topic) => (
                            <li
                                role="button"
                                onClick={() => nav(`/discuss/${topic.id}`)}
                                key={topic.id}
                                className={clsx(
                                    "hover:bg-background/80 group relative flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all duration-200",
                                    topic.pinned && "ring-warn/30 ring-1"
                                )}
                            >
                                {/* Icon badge */}
                                <div
                                    className={clsx(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                                        topic.pinned
                                            ? "bg-warn/15 text-warn"
                                            : "bg-secondary/10 text-secondary"
                                    )}
                                >
                                    {topic.pinned ? (
                                        <Pin className="h-4 w-4" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        {topic.pinned && (
                                            <span className="text-warn shrink-0 text-[10px] font-semibold tracking-wider uppercase">
                                                Pinned
                                            </span>
                                        )}
                                        <h3 className="text-text group-hover:text-secondary truncate text-sm font-semibold transition-colors">
                                            {topic?.name || "Loading..."}
                                        </h3>
                                    </div>

                                    {topic.description && (
                                        <p className="text-text/60 mt-0.5 line-clamp-2 text-xs leading-relaxed">
                                            {topic.description}
                                        </p>
                                    )}

                                    <p className="text-text/40 mt-1 text-[10px]">
                                        Created{" "}
                                        {new Date(
                                            topic.createdAt
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Arrow indicator */}
                                <ArrowRight className="text-text/30 group-hover:text-secondary h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                            </li>
                        ))}
                    </ul>
                )}

                {/* Loading skeleton */}
                {(isLoading || !data) &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 rounded-lg p-3"
                        >
                            <div className="bg-text/10 h-10 w-10 shrink-0 animate-pulse rounded-lg" />

                            <div className="flex flex-1 flex-col gap-2">
                                <div
                                    className="bg-text/10 h-3 animate-pulse rounded"
                                    style={{
                                        width: `${Math.floor(Math.random() * 30) + 50}%`
                                    }}
                                />
                                <div
                                    className="bg-text/10 h-2 animate-pulse rounded"
                                    style={{
                                        width: `${Math.floor(Math.random() * 20) + 70}%`
                                    }}
                                />
                            </div>
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
                        className="text-secondary hover:text-secondary/80 mt-1 flex items-center justify-center gap-1 text-sm font-medium transition-colors"
                    >
                        View all discussions
                        <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </Card>
    )
}
