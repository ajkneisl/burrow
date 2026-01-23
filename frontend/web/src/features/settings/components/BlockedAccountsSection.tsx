import { getBlockedAccounts } from "@features/settings/settings.api.ts"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card } from "@umnburrow/core"
import { ShieldOff, UserCircle } from "lucide-react"
import toast from "react-hot-toast"
import { Link } from "react-router"
import {unblockUser} from "@features/profile/profile.api.ts";

/**
 * View blocked accounts on settings.
 *
 * @author AJ Kneisl
 */
export default function BlockedAccountsSection() {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ["settings", "blocked"],
        queryFn: getBlockedAccounts
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
                    <ShieldOff className="text-text/30 h-12 w-12" />
                    <p className="text-text/60 mt-4 text-center">
                        You haven't blocked anyone
                    </p>
                    <p className="text-text/40 mt-2 text-center text-sm">
                        Blocked users won't be able to see your profile or
                        burrows you host
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {data.map((user) => (
                        <div
                            key={user.userID}
                            className="border-card-border bg-background flex items-center gap-4 rounded-xl border p-4"
                        >
                            <Link
                                to={`/user/${user.username}`}
                                className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                            >
                                <UserCircle className="text-primary h-7 w-7" />
                            </Link>

                            <Link
                                to={`/user/${user.username}`}
                                className="min-w-0 flex-1"
                            >
                                <p className="text-text truncate font-semibold">
                                    {user.name}
                                </p>

                                <p className="text-text/60 truncate text-sm">
                                    @{user.username}
                                </p>
                            </Link>

                            <Button
                                color="SUCCESS"
                                onClick={() => unblockMutation.mutate(user.userID)}
                                loading={unblockMutation.isPending}
                            >
                                <ShieldOff className="h-4 w-4" />
                                Unblock
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}