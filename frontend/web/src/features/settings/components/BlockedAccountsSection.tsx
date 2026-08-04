import { getBlockedUsers, unblockUser } from "@umnburrow/core/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card } from "@umnburrow/core"
import { ShieldOff, UserCircle } from "lucide-react"
import toast from "react-hot-toast"
import { Link } from "react-router"

/**
 * View blocked accounts on settings.
 *
 * @author AJ Kneisl
 */
export default function BlockedAccountsSection() {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ["settings", "blocked"],
        queryFn: getBlockedUsers
    })

    const unblockMutation = useMutation({
        mutationFn: unblockUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["settings", "blocked"]
            })
            toast.success("User unblocked")
        },

        onError: (error: Error) => {
            toast.error(error.message || "Failed to unblock user")
        }
    })

    return (
        <Card className="flex flex-col gap-4">
            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="text-text/60">Loading...</div>
                </div>
            ) : !data || data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <ShieldOff className="size-12 text-text/30" />
                    <p className="mt-4 text-center text-text/60">
                        You haven't blocked anyone
                    </p>
                    <p className="mt-2 text-center text-sm text-text/40">
                        Blocked users won't be able to see your profile or
                        burrows you host
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {data.map((user) => (
                        <div
                            key={user.userID}
                            className="flex items-center gap-4 rounded-xl border border-card-border bg-background p-4"
                        >
                            <Link
                                to={`/user/${user.username}`}
                                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20"
                            >
                                <UserCircle className="size-7 text-primary" />
                            </Link>

                            <Link
                                to={`/user/${user.username}`}
                                className="min-w-0 flex-1"
                            >
                                <p className="truncate font-semibold text-text">
                                    {user.name}
                                </p>

                                <p className="truncate text-sm text-text/60">
                                    @{user.username}
                                </p>
                            </Link>

                            <Button
                                color="SUCCESS"
                                onClick={() => unblockMutation.mutate(user.userID)}
                                loading={unblockMutation.isPending}
                            >
                                <ShieldOff className="size-4" />
                                Unblock
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}