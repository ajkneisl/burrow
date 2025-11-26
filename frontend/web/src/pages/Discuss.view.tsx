import { useState } from "react"
import { useNavigate } from "react-router"
import { MessageSquare, Pin, Plus, Users } from "lucide-react"
import type { Topic } from "@features/chat/chat.types.ts"
import { Button, Input, TextArea, ViewErrors } from "@umnburrow/core"
import clsx from "clsx"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTopic, getTopics } from "@features/chat/chat.api.ts"
import { motion, AnimatePresence } from "framer-motion"

/**
 * View all topics and create new ones.
 *
 * @author AJ Kneisl
 */
export default function Discuss() {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["topics"],
        queryFn: async () => await getTopics(1)
    })

    const mutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            createTopic(data.name, data.description),

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["topics"] })

            setNewName("")
            setNewDescription("")
            setShowCreate(false)
        }
    })

    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDescription, setNewDescription] = useState("")

    const handleCreateTopic = () => {
        if (newName.trim().length === 0) return

        mutation.mutate({
            name: newName.trim(),
            description: newDescription.trim() || undefined
        })
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
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="bg-card border-background rounded-xl border p-6">
                            <h2 className="text-text mb-4 text-lg font-semibold">
                                Create a new topic
                            </h2>

                            <div className="space-y-4">
                                {mutation.isError && (
                                    <ViewErrors
                                        errors={`Failed to create topic: ${mutation.error}`}
                                    />
                                )}

                                <Input
                                    text="Name"
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Topic name..."
                                    maxLength={64}
                                    required={true}
                                    disabled={mutation.isPending}
                                />

                                <TextArea
                                    text="Description (optional)"
                                    value={newDescription}
                                    onChange={(e) =>
                                        setNewDescription(e.target.value)
                                    }
                                    placeholder="What's this topic about?"
                                    maxLength={256}
                                    rows={3}
                                    disabled={mutation.isPending}
                                />

                                <div className="flex justify-start gap-3">
                                    <Button
                                        onClick={handleCreateTopic}
                                        color="SUCCESS"
                                        disabled={
                                            newName.trim().length === 0 ||
                                            mutation.isPending
                                        }
                                    >
                                        {mutation.isPending
                                            ? "Creating..."
                                            : "Create Topic"}
                                    </Button>

                                    <Button
                                        onClick={() => setShowCreate(false)}
                                        disabled={mutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* topics list */}
            <div className="space-y-3">
                {isError && <ViewErrors errors={`${error}`} />}

                {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-card border-background w-full rounded-xl border p-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-text/10 h-12 w-12 shrink-0 animate-pulse rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-3">
                                    <div className="bg-text/10 h-5 w-48 animate-pulse rounded" />
                                    <div className="bg-text/10 h-4 w-full animate-pulse rounded" />
                                    <div className="bg-text/10 h-4 w-3/4 animate-pulse rounded" />
                                    <div className="bg-text/10 h-3 w-32 animate-pulse rounded" />
                                </div>
                            </div>
                        </div>
                    ))}

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
                                "bg-card hover:bg-card/80 border-background group w-full cursor-pointer rounded-xl border p-4 text-left transition-all hover:shadow-md",
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

                                    {topic.createdAt !== -1 && (
                                        <div className="text-text/40 mt-2 flex items-center gap-4 text-xs">
                                            <span>
                                                Created{" "}
                                                {new Date(
                                                    topic.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
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
