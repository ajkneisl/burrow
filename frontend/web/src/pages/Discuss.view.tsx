import { useState } from "react"
import { useNavigate } from "react-router"
import { MessageSquare, Pin, Plus, Users } from "lucide-react"
import type { Topic } from "@features/chat/chat.types.ts"
import { Button, Input, TextArea, ViewErrors } from "@umnburrow/core"
import clsx from "clsx"
import { useQuery } from "@tanstack/react-query"
import {getTopics} from "@features/chat/chat.api.ts";

/**
 * View all topics and create new ones.
 *
 * @author AJ Kneisl
 */
export default function Discuss() {
    const nav = useNavigate()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["topics"],
        queryFn: async () => await getTopics(1)
    })

    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDescription, setNewDescription] = useState("")

    const handleCreateTopic = () => {
        if (newName.trim().length === 0) return

        // createTopic(newName.trim(), newDescription.trim())
        setNewName("")
        setNewDescription("")
        setShowCreate(false)
    }

    const handleTopicClick = (topic: Topic) => {
        nav(`/discuss/${topic.id}`)
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            {/* header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-text text-3xl font-bold">Discuss</h1>
                    <p className="text-text/60 mt-1">
                        Join discussions on Burrow.
                    </p>
                </div>

                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="h-5 w-5" />
                    New Topic
                </Button>
            </div>

            {/* create topic */}
            {showCreate && (
                <div className="bg-hero border-background mb-6 rounded-xl border p-6">
                    <h2 className="text-text mb-4 text-lg font-semibold">
                        Create a new topic
                    </h2>

                    <div className="space-y-4">
                        <Input
                            text="Name"
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Topic name..."
                            maxLength={64}
                            required={true}
                        />

                        <TextArea
                            text="Description (optional)"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="What's this topic about?"
                            maxLength={256}
                            rows={3}
                        />

                        <div className="flex justify-start gap-3">
                            <Button
                                onClick={handleCreateTopic}
                                color="SUCCESS"
                                disabled={newName.trim().length === 0}
                            >
                                Create Topic
                            </Button>

                            <Button onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* topics list */}
            <div className="space-y-3">
                {isError && <ViewErrors errors={`${error}`} />}

                {isLoading && <p>loading trust</p>}

                {!isLoading && data && data.length === 0 && (
                    <div className="text-text/50 py-12 text-center">
                        <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
                        <p>No topics yet.</p>
                    </div>
                )}

                {!isLoading &&
                    data &&
                    data.length > 0 &&
                    data?.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic)}
                            className={clsx(
                                "bg-hero hover:bg-hero/80 border-background group w-full cursor-pointer rounded-xl border p-4 text-left transition-all hover:shadow-md",
                                topic.pinned && "ring-primary ring-2"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className={clsx(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                                        topic.pinned
                                            ? "bg-primary text-text"
                                            : "bg-secondary/10 text-secondary"
                                    )}
                                >
                                    {topic.pinned ? (
                                        <Pin className="h-6 w-6" />
                                    ) : (
                                        <MessageSquare className="h-6 w-6" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-text group-hover:text-secondary truncate text-lg font-semibold transition-colors">
                                            {topic.name}
                                        </h3>
                                    </div>

                                    {topic.description && (
                                        <p className="text-text/60 mt-1 line-clamp-2 text-sm">
                                            {topic.description}
                                        </p>
                                    )}

                                    <div className="text-text/40 mt-2 flex items-center gap-4 text-xs">
                                        <span>
                                            Created{" "}
                                            {new Date(
                                                topic.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-text/30 group-hover:text-secondary/50 transition-colors">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </button>
                    ))}
            </div>
        </main>
    )
}
