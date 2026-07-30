import { followUser, unfollowUser } from "@umnburrow/core/api"
import type { DiscoveredUser } from "@umnburrow/core/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import toast from "react-hot-toast"
import { getReasoningLabel } from "@features/profile/profile.util.ts"
import { Button, Card } from "@umnburrow/core"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { Plus } from "lucide-react"

/**
 * Discovered user
 *
 * @author AJ Kneisl
 */
export default function DiscoveredUserCard({ user }: { user: DiscoveredUser }) {
    const queryClient = useQueryClient()
    const [isFollowing, setIsFollowing] = useState(false)

    const followMutation = useMutation({
        mutationFn: () => followUser(user.userID),
        onSuccess: () => {
            setIsFollowing(true)

            void queryClient.invalidateQueries({ queryKey: ["friends"] })
            void queryClient.invalidateQueries({ queryKey: ["discovered"] })

            toast.success(`Following ${user.name}`)
        },
        onError: () => {
            toast.error("Failed to follow user")
        }
    })

    const unfollowMutation = useMutation({
        mutationFn: () => unfollowUser(user.userID),
        onSuccess: () => {
            setIsFollowing(false)

            void queryClient.invalidateQueries({ queryKey: ["friends"] })
            void queryClient.invalidateQueries({ queryKey: ["discovered"] })

            toast.success(`Unfollowed ${user.name}`)
        },
        onError: () => {
            toast.error("Failed to unfollow user")
        }
    })

    return (
        <Card className="flex flex-row items-start gap-2 bg-background!">
            {/* profile picture */}
            <ProfilePicture name={user.name} userID={user.userID} size="md" />

            <div className="flex-1">
                <h4 className="text-sm font-semibold text-text">{user.name}</h4>
                <p className="text-xs text-text/60">@{user.username}</p>

                <p className="mt-2 text-xs text-text/40">
                    {getReasoningLabel(user.reasoning)}
                </p>
            </div>

            <div className="flex flex-col items-center">
                <Button
                    color={isFollowing ? undefined : "PRIMARY"}
                    colors={
                        isFollowing
                            ? "bg-text/10 text-text hover:bg-text/20"
                            : undefined
                    }
                    thin
                    onClick={() => {
                        if (isFollowing) {
                            unfollowMutation.mutate()
                        } else {
                            followMutation.mutate()
                        }
                    }}
                >
                    {isFollowing ? (
                        "Following"
                    ) : (
                        <>
                            <Plus className="size-4" />
                            Follow
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}
