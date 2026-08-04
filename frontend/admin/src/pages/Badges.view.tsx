import { createBadge, deleteBadge, getBadges, getUserBadges, updateUserBadges } from "@umnburrow/core/api"
import type { Badge } from "@umnburrow/core/api"
import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Input } from "@umnburrow/core"

import { CDN_URL } from "../features/auth/admin.atom.ts"

/**
 * Manage badges.
 *
 * @author AJ Kneisl
 */
export default function BadgesView() {
    const queryClient = useQueryClient()

    const { data: badges, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["admin", "badges"],
        queryFn: () => getBadges(),
        refetchOnWindowFocus: true
    })

    // create badge
    const [newID, setNewID] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newImage, setNewImage] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // user badges
    const [userID, setUserID] = useState("")
    const [userBadges, setUserBadges] = useState<string[]>([])
    const [userBadgesLoaded, setUserBadgesLoaded] = useState(false)

    const createMutation = useMutation({
        mutationFn: () => {
            if (!newImage) throw new Error("Image is required")

            return createBadge(newID, newDescription, newImage, newImage.type)
        },

        onSuccess: () => {
            setNewID("")
            setNewDescription("")
            setNewImage(null)

            if (fileInputRef.current) fileInputRef.current.value = ""

            queryClient.invalidateQueries({ queryKey: ["admin", "badges"] })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteBadge(id),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "badges"] })
        }
    })

    const loadUserBadgesMutation = useMutation({
        mutationFn: (id: string) => getUserBadges(id),

        onSuccess: (data) => {
            setUserBadges(data)
            setUserBadgesLoaded(true)
        }
    })

    const updateUserBadgesMutation = useMutation({
        mutationFn: () => updateUserBadges(userID, userBadges),

        onSuccess: () => {
            setUserBadgesLoaded(false)
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (file) {
            const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"]

            if (!validTypes.includes(file.type)) {
                alert("Invalid file type. Please use PNG, JPEG, GIF, or WebP.")
                return
            }

            if (file.size > 16 * 1024 * 1024) {
                alert("Image must be under 16 MB!")
                return
            }

            setNewImage(file)
        }
    }

    const toggleBadge = (badgeId: string) => {
        setUserBadges((prev) =>
            prev.includes(badgeId)
                ? prev.filter((id) => id !== badgeId)
                : [...prev, badgeId]
        )
    }

    return (
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Badges</h1>

                <Button onClick={() => refetch()}>
                    {isFetching ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* all badges */}
                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4">All Badges</h2>

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
                                Failed to load badges
                            </div>

                            <div className="mt-1 text-muted-foreground">
                                {(error as Error)?.message || "Unknown error"}
                            </div>
                        </div>
                    ) : badges?.length === 0 ? (
                        <div className="rounded-lg border border-primary/10 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                            No badges created yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {badges?.map((badge: Badge) => (
                                <div
                                    key={badge.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`${CDN_URL}/badges/${badge.id}`}
                                            alt={badge.id}
                                            className="h-10 w-10 rounded object-contain"
                                        />
                                        <div>
                                            <div className="font-medium">{badge.id}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {badge.description}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            if (confirm(`Delete badge "${badge.id}"?`)) {
                                                deleteMutation.mutate(badge.id)
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending ? "..." : "Delete"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Create Badge */}
                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4">Create Badge</h2>

                    <div className="space-y-3">
                        <Input
                            value={newID}
                            onChange={(e) => setNewID(e.target.value)}
                            placeholder="Badge ID (e.g., early-adopter)"
                            maxLength={32}
                        />
                        <Input
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Description"
                            maxLength={255}
                        />

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20"
                        />

                        {newImage && (
                            <div className="text-sm text-muted-foreground">
                                Selected: {newImage.name}
                            </div>
                        )}

                        {createMutation.isError && (
                            <div className="text-sm text-error">
                                {(createMutation.error as Error)?.message || "Failed to create badge"}
                            </div>
                        )}

                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={
                                !newID || !newDescription || !newImage || createMutation.isPending
                            }
                        >
                            {createMutation.isPending ? "Creating..." : "Create Badge"}
                        </Button>
                    </div>
                </Card>

                {/* user badges */}
                <Card className="p-4 lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">User Badges</h2>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={userID}
                                onChange={(e) => {
                                    setUserID(e.target.value)
                                    setUserBadgesLoaded(false)
                                }}
                                placeholder="User ID"
                                className="flex-1"
                            />

                            <Button
                                onClick={() => loadUserBadgesMutation.mutate(userID)}
                                disabled={!userID || loadUserBadgesMutation.isPending}
                            >
                                {loadUserBadgesMutation.isPending ? "Loading..." : "Load User"}
                            </Button>
                        </div>

                        {loadUserBadgesMutation.isError && (
                            <div className="text-sm text-error">
                                {(loadUserBadgesMutation.error as Error)?.message ||
                                    "Failed to load user badges"}
                            </div>
                        )}

                        {userBadgesLoaded && (
                            <>
                                <div className="text-sm text-muted-foreground">
                                    Select badges to assign to user: {userID}
                                </div>

                                {badges?.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        No badges available. Create some first.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {badges?.map((badge: Badge) => (
                                            <button
                                                key={badge.id}
                                                onClick={() => toggleBadge(badge.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                                    userBadges.includes(badge.id)
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-muted/20 hover:bg-muted/40"
                                                }`}
                                            >
                                                <img
                                                    src={`${CDN_URL}/badges/${badge.id}`}
                                                    alt={badge.id}
                                                    className="h-5 w-5 object-contain"
                                                />

                                                {badge.id}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="text-sm">
                                    Selected: {userBadges.length === 0 ? "None" : userBadges.join(", ")}
                                </div>

                                {updateUserBadgesMutation.isError && (
                                    <div className="text-sm text-error">
                                        {(updateUserBadgesMutation.error as Error)?.message ||
                                            "Failed to update user badges"}
                                    </div>
                                )}

                                {updateUserBadgesMutation.isSuccess && (
                                    <div className="text-sm text-green-600">
                                        User badges updated successfully!
                                    </div>
                                )}

                                <Button
                                    onClick={() => updateUserBadgesMutation.mutate()}
                                    disabled={updateUserBadgesMutation.isPending}
                                >
                                    {updateUserBadgesMutation.isPending
                                        ? "Saving..."
                                        : "Save User Badges"}
                                </Button>
                            </>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}