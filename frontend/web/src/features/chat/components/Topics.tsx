import { useQuery } from "@tanstack/react-query"
import { getTopics } from "@features/chat/chat.api.ts"
import { Card, ViewErrors } from "@umnburrow/core"
import clsx from "clsx"
import { MessageSquare, Pin } from "lucide-react"
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

    return (
        <Card title="Discuss on Burrow" className="mt-4">
            <ul className="flex flex-col gap-2">
                {isError && <ViewErrors errors={`${error}`} />}

                {data &&
                    data.length > 0 &&
                    data.splice(0, 5).map((topic) => (
                        <li
                            role="button"
                            onClick={() => nav(`/discuss/${topic.id}`)}
                            key={topic.id}
                            className="bg-background flex cursor-pointer flex-row items-center gap-4 rounded-lg p-4"
                        >
                            <div
                                className={clsx(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    topic.pinned
                                        ? "bg-primary text-text"
                                        : "bg-secondary/10 text-secondary"
                                )}
                            >
                                {topic.pinned ? (
                                    <Pin className="h-4 w-4" />
                                ) : (
                                    <MessageSquare className="h-4 w-4" />
                                )}
                            </div>

                            <h1 className="text-text truncate text-xl font-bold">
                                {topic?.name || "Loading..."}
                            </h1>
                        </li>
                    ))}

                {(isLoading || !data) &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <li
                            key={i}
                            className="bg-background/30 flex items-center gap-2 rounded-lg px-4 py-3"
                        >
                            <div className="bg-text/10 size-8 animate-pulse rounded-md" />

                            <div
                                className={`bg-text/10 h-3 animate-pulse rounded`}
                                style={{
                                    width: `${Math.floor(Math.random() * (50 + 1)) + 25}%`
                                }}
                            />
                        </li>
                    ))}
            </ul>
        </Card>
    )
}
